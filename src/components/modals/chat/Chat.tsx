"use client";

import { useBackClose } from "@/lib/backLayers";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import "./Chat.css";
import "@/components/skeleton/Skeleton.css";
import { useAuth } from "@/lib/auth";
import { MAX_VOICE_SECONDS, uploadChatMedia, useVoiceRecorder, type VoiceResult } from "@/lib/useVoiceRecorder";
import { useLanguage } from "@/lib/language";
import VoiceBubble from "./VoiceBubble";
import { chatOlderAction, chatOpenAction, chatRateAction, chatReadAction, chatSendAction, chatShortcutRunAction, chatShortcutsAction, type ChatShortcut, chatTypingAction, type ChatMedia, type ChatMsg } from "@/app/chat-actions";

/** a message on screen: the saved one, or one still being sent / that failed (kept with its own id so a retry never duplicates it) */
type Row = ChatMsg & { state?: "sending" | "failed"; /** kept so a failed message can be sent again */ retry?: { media?: ChatMedia; blob?: Blob; kind?: "image" | "voice"; transcript?: string; seconds?: number; waveform?: number[] } };

export interface ChatProps {
  onClose: () => void;
  startInTicketMode?: boolean;
  /** opened from a product page: the question starts with the product's name */
  product?: { id: string; name: string; image?: string };
  requestCloseRef?: { current: (() => void) | null };
}

export const OPEN_CHAT_EVENT = "tazahat:open-chat";

const timeOf = (iso: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
function dayLabel(iso: string) {
  const key = dayKey(iso);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c${Date.now()}${Math.random().toString(36).slice(2, 8)}`);

/** grey bubbles with a soft shine while the conversation loads (alternating sides, like real messages) */
function ChatSkeleton({ rows }: { rows: number }) {
  const widths = [62, 44, 74, 38, 56, 68];
  return <>{Array.from({ length: rows }, (_, i) => <div key={i} className={`chat-sk-row${i % 2 ? " is-mine" : ""}`}><span className="sk" style={{ width: `${widths[i % widths.length]}%`, height: i % 3 === 2 ? 46 : 30 }} /></div>)}</>;
}

/** WhatsApp-style support chat: signed-in customers only, the last 20 messages first, 10 more each time you scroll up, live replies, ticks and "typing...". */
const ORDER_COLOR: Record<string, string> = { PENDING: "#f59e0b", IN_PROGRESS: "#3b82f6", PROCESSING: "#8b5cf6", PACKAGING: "#06b6d4", OUT_FOR_DELIVERY: "#ec4899", DELIVERED: "#10b981", CANCELLED: "#ef4444" };

/** "Please rate our delivered order": five stars; once rated it shows the stars given */
function RateCard({ card }: { card: NonNullable<ChatMsg["card"]> }) {
  const [given, setGiven] = useState(card.status === "rated" ? Number(card.badge) || 0 : 0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (card.status === "rated") setGiven(Number(card.badge) || 0); }, [card.status, card.badge]);
  const done = given > 0;
  const tap = async (n: number) => {
    if (done || busy || !card.ref) return;
    setBusy(true);
    const r = await chatRateAction(card.ref, n);
    setBusy(false);
    if (r.ok) setGiven(n);
  };
  return (
    <div className="chat-card chat-card--rate">
      <div className="chat-card-offer-head chat-card-rate-head">⭐ Rate your order</div>
      <div className="chat-card-body">
        <b className="chat-card-title">{card.title}</b>
        <span className="chat-card-sub">{done ? "Thank you for rating!" : card.subtitle}</span>
        <div className="chat-stars" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={given === n} aria-label={`${n} star${n === 1 ? "" : "s"}`} disabled={done || busy} className={n <= (hover || given) ? "is-on" : ""} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => void tap(n)}>★</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** a product / offer / order shared by the team: the same three layouts as in the team's CRM */
function ChatCardView({ card }: { card: NonNullable<ChatMsg["card"]> }) {
  const [copied, setCopied] = useState("");
  const copy = (text: string, what: string) => { void navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(""), 1500); }); };
  if (card.kind === "order") {
    const col = ORDER_COLOR[card.status ?? ""] ?? "#3b82f6";
    return (
      <div className="chat-card chat-card--order" style={{ borderLeftColor: col }}>
        <div className="chat-card-row"><span className="chat-card-kind">🧾 Order</span>{card.badge && <span className="chat-card-pill" style={{ background: col }}>{card.badge}</span>}</div>
        <div className="chat-card-row"><b className="chat-card-title">{card.title}</b>{card.price && <b className="chat-card-price">{card.price}</b>}</div>
        {card.subtitle && <span className="chat-card-sub">{card.subtitle}</span>}
      </div>
    );
  }
  if (card.kind === "offer") {
    return (
      <div className="chat-card chat-card--offer">
        <div className="chat-card-offer-head">🏷️ {card.badge || "Offer"}</div>
        <div className="chat-card-body"><b className="chat-card-title">{card.title}</b>{card.subtitle && <span className="chat-card-sub">{card.subtitle}</span>}</div>
        {card.code && (
          <div className="chat-card-code-row">
            <span className="chat-card-code">{card.code}</span>
            <button type="button" onClick={() => copy(card.code!, "code")}>{copied === "code" ? "Copied ✓" : "Copy"}</button>
          </div>
        )}
      </div>
    );
  }
  if (card.kind === "rate") return <RateCard card={card} />;
  const inner = (
    <>
      {card.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="chat-card-photo" src={card.image} alt={card.title} loading="lazy" /> : <div className="chat-card-photo chat-card-photo--empty" aria-hidden="true">🛍️</div>}
      <div className="chat-card-body">
        <span className="chat-card-kind">🛍️ Product</span>
        <b className="chat-card-title chat-card-title--name">{card.title}</b>
        {card.subtitle && <span className="chat-card-sub">{card.subtitle}</span>}
        {card.price && <b className="chat-card-price">{card.price}</b>}
        {card.url && <span className="chat-card-open">View product →</span>}
      </div>
    </>
  );
  return card.url ? <a className="chat-card chat-card--product" href={card.url} target="_blank" rel="noopener noreferrer">{inner}</a> : <div className="chat-card chat-card--product">{inner}</div>;
}

export default function Chat({ onClose, product, requestCloseRef, startInTicketMode = false }: ChatProps) {
  const { user, ready, openLogin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [message, setMessage] = useState(() => (product ? `Hi, I have a question about ${product.name}: ` : ""));
  const [supportTyping, setSupportTyping] = useState(false);
  const [language] = useLanguage();
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");
  // the quick questions under the header: built from the customer's own orders / tickets / offers; a tap is answered by the system
  const [shortcuts, setShortcuts] = useState<ChatShortcut[]>([]);
  const [shortcutBusy, setShortcutBusy] = useState("");
  const loadShortcuts = useCallback(() => { void chatShortcutsAction().then(setShortcuts).catch(() => undefined); }, []);
  useEffect(() => { if (user) loadShortcuts(); }, [user, loadShortcuts]);
  const merge = useCallback((list: ChatMsg[]) => setRows((cur) => { const out = [...cur]; for (const m of list) if (!out.some((r) => r.id === m.id)) out.push(m); return out; }), []);
  const runShortcut = async (sc: ChatShortcut) => {
    if (shortcutBusy) return;
    setShortcutBusy(sc.id);
    stickToEnd.current = true;
    const r = await chatShortcutRunAction(sc.id);
    setShortcutBusy("");
    if (r.ok) { stickToEnd.current = true; merge([r.data.question, ...r.data.answers]); }
    loadShortcuts();
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const stickToEnd = useRef(true);
  const prependFrom = useRef<number | null>(null);
  const older = useRef(false);
  const rowsRef = useRef<Row[]>([]);
  rowsRef.current = rows;

  const closeChat = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimer.current = setTimeout(onClose, 380);
  }, [isClosing, onClose]);
  useBackClose(closeChat);
  // a click outside the chat closes it (the round chat button has its own toggle)
  useEffect(() => {
    const away = (e: MouseEvent | TouchEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.closest(".chat-panel, .floating-message-button, .floating-message-peek, [role='dialog'], .lightbox, .chat-lightbox")) return;
      closeChat();
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away, { passive: true });
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [closeChat]);
  useEffect(() => {
    if (requestCloseRef) { requestCloseRef.current = closeChat; return () => { requestCloseRef.current = null; }; }
  }, [closeChat, requestCloseRef]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") closeChat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [closeChat]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  // open: the latest 20 messages, then tell support they were read
  const open = useCallback(async () => {
    setState("loading");
    const res = await chatOpenAction();
    if (!res.ok) { setState("error"); return; }
    setRows(res.data.messages);
    setHasMore(res.data.hasMore);
    stickToEnd.current = true;
    setState("ready");
    if (res.data.unread > 0) void chatReadAction();
  }, []);
  useEffect(() => { if (user) void open(); }, [user, open]);

  // live: a reply, a read receipt, "typing..." (the page's own realtime link passes them on as one window event)
  useEffect(() => {
    const onChat = (e: Event) => {
      const d = (e as CustomEvent<{ kind: string; message?: ChatMsg; by?: string; on?: boolean; at?: string }>).detail;
      if (d.kind === "message" && d.message) {
        const m = d.message;
        setRows((cur) => (cur.some((r) => r.id === m.id || (m.clientId && r.clientId === m.clientId)) ? cur.map((r) => (r.clientId && r.clientId === m.clientId ? m : r)) : [...cur, m]));
        if (m.fromSupport) { loadShortcuts(); setSupportTyping(false); if (document.visibilityState === "visible") void chatReadAction(); }
      } else if (d.kind === "update" && d.message) {
        const m = d.message; // e.g. the text of a voice message was written down a moment after it was sent
        setRows((cur) => cur.map((r) => (r.id === m.id ? m : r)));
      } else if (d.kind === "read" && d.by === "support" && d.at) {
        const at = d.at;
        setRows((cur) => cur.map((r) => (!r.fromSupport && !r.readAt ? { ...r, readAt: at } : r)));
      } else if (d.kind === "typing" && d.by === "support") {
        setSupportTyping(!!d.on);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        if (d.on) typingTimer.current = setTimeout(() => setSupportTyping(false), 6000);
      }
    };
    window.addEventListener("tazahat:chat", onChat);
    return () => window.removeEventListener("tazahat:chat", onChat);
  }, []);

  // scrolling: stay at the bottom for new messages; at the top, 10 older ones load and the view does not jump
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (prependFrom.current !== null) { el.scrollTop = el.scrollHeight - prependFrom.current; prependFrom.current = null; return; }
    if (stickToEnd.current) el.scrollTop = el.scrollHeight;
  }, [rows, supportTyping, state]);

  const scrollEnd = useCallback(() => { const el = scroller.current; if (el && stickToEnd.current) el.scrollTop = el.scrollHeight; }, []);
  // opened: land on the newest message (and stay there while pictures load and change the height)
  useEffect(() => {
    if (state !== "ready") return;
    stickToEnd.current = true;
    scrollEnd();
    const timers = [60, 250, 700].map((ms) => setTimeout(scrollEnd, ms));
    return () => timers.forEach(clearTimeout);
  }, [state, scrollEnd]);
  // the chat is being read now: the notification of its messages (one per conversation) is taken away
  useEffect(() => {
    const clear = async () => { try { const reg = await navigator.serviceWorker?.getRegistration(); (await reg?.getNotifications())?.forEach((n) => { if (/^chat-/.test(n.tag)) n.close(); }); } catch { /* no service worker */ } };
    void clear();
    const onChat = (e: Event) => { const d = (e as CustomEvent<{ kind: string }>).detail; if (d.kind === "message") void clear(); };
    window.addEventListener("tazahat:chat", onChat);
    return () => window.removeEventListener("tazahat:chat", onChat);
  }, []);

  const loadOlder = useCallback(async () => {
    const first = rowsRef.current.find((r) => !r.state);
    if (older.current || !hasMore || !first) return;
    older.current = true;
    setLoadingOlder(true);
    const res = await chatOlderAction({ createdAt: first.createdAt, id: first.id });
    older.current = false;
    setLoadingOlder(false);
    if (!res.ok) return;
    const el = scroller.current;
    prependFrom.current = el ? el.scrollHeight - el.scrollTop : null;
    stickToEnd.current = false;
    setRows((cur) => [...res.data.messages.filter((m) => !cur.some((r) => r.id === m.id)), ...cur]);
    setHasMore(res.data.hasMore);
  }, [hasMore]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    stickToEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60) void loadOlder();
  };

  /** sends a message; a picture / recording is uploaded first. A failed one stays on screen with "Tap to retry". */
  // "Create ticket": the next message is written as a support ticket
  const [ticketMode, setTicketMode] = useState(startInTicketMode);
  const send = async (text: string, opts: { clientId?: string; retry?: boolean; blob?: Blob; kind?: "image" | "voice"; seconds?: number; transcript?: string; waveform?: number[]; preview?: string; ticket?: boolean } = {}) => {
    const clientId = opts.clientId ?? newId();
    const now = new Date().toISOString();
    const local: Row = { id: `local-${clientId}`, threadId: "", text, fromSupport: false, createdAt: now, readAt: null, clientId, ticket: opts.ticket === true, imageUrl: opts.kind === "image" ? opts.preview ?? null : null, voiceUrl: opts.kind === "voice" && opts.blob ? URL.createObjectURL(opts.blob) : null, voiceSeconds: opts.seconds ?? null, transcript: opts.transcript || null, waveform: opts.waveform ?? [], legacyMedia: null, state: "sending", retry: { blob: opts.blob, kind: opts.kind, seconds: opts.seconds, transcript: opts.transcript, waveform: opts.waveform } };
    if (!opts.retry) setRows((cur) => [...cur, local]);
    else setRows((cur) => cur.map((r) => (r.clientId === clientId ? { ...r, state: "sending" } : r)));
    stickToEnd.current = true;
    let media: ChatMedia | undefined;
    if (opts.blob && opts.kind) {
      const up = await uploadChatMedia(opts.kind, opts.blob);
      if (!up.ok) { setMediaError(up.error); setRows((cur) => cur.map((r) => (r.clientId === clientId ? { ...r, state: "failed" } : r))); return; }
      media = opts.kind === "image" ? { imageUrl: up.url } : { voiceUrl: up.url, voiceSeconds: opts.seconds, transcript: opts.transcript, waveform: opts.waveform };
    }
    const res = await chatSendAction(text, clientId, media, opts.ticket === true);
    setRows((cur) => {
      if (!res.ok) return cur.map((r) => (r.clientId === clientId ? { ...r, state: "failed" } : r));
      const real = res.data;
      const withoutLive = cur.filter((r) => !(r.id === real.id && r.clientId !== clientId));
      return withoutLive.map((r) => (r.clientId === clientId ? real : r));
    });
  };

  // ---- voice recording ----------------------------------------------------------------------------------------------
  const sendVoice = (r: VoiceResult) => void send("", { ticket: ticketMode, blob: r.blob, kind: "voice", seconds: r.seconds, transcript: r.transcript, waveform: r.waveform });
  const voice = useVoiceRecorder(language, sendVoice); // the one-minute limit hands the recording over by itself
  const startVoice = async () => { setMediaError(""); await voice.start(); };
  const finishVoice = async () => { const r = await voice.stop(); if (r) sendVoice(r); };

  // ---- pictures -----------------------------------------------------------------------------------------------------
  const pickPhoto = (file?: File) => {
    if (!file) return;
    setMediaError("");
    if (!file.type.startsWith("image/")) { setMediaError("Choose a picture."); return; }
    if (file.size > 10 * 1024 * 1024) { setMediaError("Choose a picture under 10 MB."); return; }
    setPhoto({ file, url: URL.createObjectURL(file) });
  };
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = message.trim();
    if ((!text && !photo) || isClosing) return;
    setMessage("");
    void chatTypingAction(false);
    const ticket = ticketMode;
    setTicketMode(false);
    if (photo) { const p = photo; setPhoto(null); void send(text, { ticket, blob: p.file, kind: "image", preview: p.url }); } else void send(text, { ticket });
    input.current?.focus();
  };

  const onType = (value: string) => {
    setMessage(value);
    const now = Date.now();
    if (value.trim() && now - lastTypingSent.current > 2500) { lastTypingSent.current = now; void chatTypingAction(true); }
  };

  let lastDay = "";
  return (
    <section className={`chat-panel${isClosing ? " chat-panel--closing" : ""}`} role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header className="chat-header">
        <span className="chat-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 5h16v12H9l-5 3V5Z" /><path d="M8 9h8M8 13h5" /></svg>
        </span>
        <span className="chat-header-copy">
          <strong id="chat-title">TazaHat Support</strong>
          <span><i /> {supportTyping ? "typing…" : "We usually reply within a few minutes"}</span>
        </span>
        {user && (
          <button className={`chat-ticket-button${ticketMode ? " is-on" : ""}`} type="button" onClick={() => { setTicketMode(on => !on); input.current?.focus(); }} aria-pressed={ticketMode} aria-label="Create a support ticket">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3v3Z" /><path d="M13 6v12" strokeDasharray="2 2" /></svg>
            <span>Create ticket</span>
          </button>
        )}
      </header>

      {!user ? (
        <div className="chat-gate">
          <span className="chat-gate-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v12H9l-5 3V5Z" /><path d="M8 9h8M8 13h5" /></svg></span>
          <strong>Log in to chat with us</strong>
          <p>Your messages stay private and saved to your account, so our team can see your orders and help faster.</p>
          <button type="button" className="chat-gate-button" disabled={!ready} onClick={() => openLogin()}>Log in</button>
        </div>
      ) : (
        <>
          {shortcuts.length > 0 && (
            <div className="chat-shortcuts" role="toolbar" aria-label="Quick questions">
              {shortcuts.map((sc) => (
                <button key={sc.id} type="button" className="chat-shortcut" disabled={!!shortcutBusy} onClick={() => void runShortcut(sc)}>
                  <span aria-hidden="true">{sc.icon === "order" ? "📦" : sc.icon === "ticket" ? "🎫" : sc.icon === "star" ? "⭐" : "🏷️"}</span>{sc.label}
                </button>
              ))}
            </div>
          )}
          <div className="chat-messages" ref={scroller} onScroll={onScroll} aria-live="polite" aria-relevant="additions text">
            {loadingOlder && <div className="chat-sk-group" role="status" aria-label="Loading earlier messages"><ChatSkeleton rows={2} /></div>}
            {state === "loading" && <div className="chat-sk-group" role="status" aria-label="Loading your chat"><ChatSkeleton rows={6} /></div>}
            {state === "error" && <div className="chat-older">Could not load the chat. <button type="button" className="chat-retry" onClick={() => void open()}>Try again</button></div>}
            {state === "ready" && rows.length === 0 && <div className="chat-empty"><strong>Say hello 👋</strong><span>Ask about an order, a product or delivery. Our team will reply here.</span></div>}
            {rows.map((m) => {
              const day = dayKey(m.createdAt);
              const divider = day !== lastDay ? <div className="chat-day-divider" key={`d-${day}-${m.id}`}><span>{dayLabel(m.createdAt)}</span></div> : null;
              lastDay = day;
              const mine = !m.fromSupport;
              if (m.system) return (<div className="chat-row" key={m.id} style={{ display: "contents" }}>{divider}<div className="chat-system-line" role="status">{m.text}</div></div>);
              return (
                <div className="chat-row" key={m.clientId ?? m.id} style={{ display: "contents" }}>
                  {divider}
                  <article id={`chat-message-${m.id}`} className={`chat-message chat-message--${mine ? "customer" : "team"}${m.state === "failed" ? " is-failed" : ""}`}>
                    {m.ticket && <span className="chat-ticket-tag">🎫 Ticket</span>}
                    {!mine && <span className="chat-message-author">{m.sentBy ? `${m.sentBy} · TazaHat Support` : "TazaHat Support"}</span>}
                    {m.legacyMedia && <div className="chat-media-missing"><span aria-hidden="true">{m.legacyMedia === "image" ? "📷" : m.legacyMedia === "voice" ? "🎤" : m.legacyMedia === "video" ? "🎥" : "📎"}</span><span>{m.legacyMedia === "image" ? "Photo" : m.legacyMedia === "voice" ? "Voice message" : m.legacyMedia === "video" ? "Video" : "Document"} is no longer available</span></div>}
                    {m.imageUrl && <button type="button" className="chat-photo" onClick={() => setLightbox(m.imageUrl)} aria-label="Open photo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.imageUrl} alt="Photo in chat" loading="lazy" onLoad={scrollEnd} /></button>}
                    {m.voiceUrl && <VoiceBubble src={m.voiceUrl} seconds={m.voiceSeconds ?? 1} transcript={m.transcript} waveform={m.waveform} />}
                    {m.card ? <ChatCardView card={m.card} /> : (m.text && <p>{m.text}</p>)}
                    <time>
                      {timeOf(m.createdAt)}
                      {mine && (m.state === "sending" ? <span className="chat-tick" aria-label="Sending">🕓</span> : m.state === "failed" ? null : <span className={`chat-tick${m.readAt ? " is-read" : ""}`} aria-label={m.readAt ? "Read" : "Sent"}>{m.readAt ? "✓✓" : "✓"}</span>)}
                    </time>
                    {m.state === "failed" && <button type="button" className="chat-retry" onClick={() => void send(m.text, { ticket: m.ticket, clientId: m.clientId ?? newId(), retry: true, blob: m.retry?.blob, kind: m.retry?.kind, seconds: m.retry?.seconds, transcript: m.retry?.transcript, waveform: m.retry?.waveform, preview: m.imageUrl ?? undefined })}>Not sent · Tap to retry</button>}
                  </article>
                </div>
              );
            })}
            {(supportTyping || shortcutBusy) && <div className="chat-typing" role="status" aria-label={shortcutBusy ? "Analyzing" : "Support is typing"}><span>{shortcutBusy ? "Analyzing" : "Support is typing"}</span><i /><i /><i /></div>}
          </div>

          <form className="chat-composer" onSubmit={submit}>
            {ticketMode && (
              <div className="chat-ticket-banner" role="status">
                <span aria-hidden="true">🎫</span>
                <span><strong>New ticket</strong><small>What is your problem? Tell us in detail and we will save it as a ticket.</small></span>
                <button type="button" aria-label="Cancel the ticket" onClick={() => setTicketMode(false)}>×</button>
              </div>
            )}
            {mediaError && <p className="chat-attachment-error" role="alert">{mediaError}</p>}
            {voice.error && <p className="chat-attachment-error" role="alert">{voice.error}</p>}
            {photo && (
              <div className="chat-composer-context chat-image-attachment">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="Selected picture" width={76} height={76} />
                <span className="chat-composer-context-copy"><strong>Picture ready to send</strong><small>Add a few words if you like, then send</small></span>
                <button type="button" aria-label="Remove picture" onClick={() => setPhoto(null)}>×</button>
              </div>
            )}
            <input ref={fileInput} className="chat-sr-only" type="file" accept="image/*" aria-label="Choose a picture" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
            {voice.recording ? (
              <div className="chat-recording" role="status" aria-label="Recording">
                <button type="button" className="chat-rec-cancel" onClick={voice.cancel} aria-label="Cancel recording"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" /></svg></button>
                <span className="chat-rec-dot" aria-hidden="true" />
                <span className="chat-rec-time">{Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, "0")} <small>/ {Math.floor(MAX_VOICE_SECONDS / 60)}:00</small></span>
                <span className="chat-rec-wave" aria-hidden="true">{Array.from({ length: 36 }, (_, i) => { const v = voice.live[voice.live.length - 36 + i] ?? 0; return <i key={i} style={{ height: `${Math.max(12, Math.min(100, v * 380))}%` }} />; })}</span>
                <button type="button" className="chat-send-button" onClick={() => void finishVoice()} aria-label="Send voice message">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-8-7 18-3-7-8-3Z" /><path d="m11 14 4-4" /></svg>
                </button>
              </div>
            ) : (
              <>
                <label className="chat-sr-only" htmlFor="chat-message-input">Message to TazaHat support</label>
                <input ref={input} id="chat-message-input" value={message} onChange={(e) => onType(e.target.value)} placeholder={ticketMode ? "What is your problem? Tell us in detail" : "Type a message"} maxLength={2000} disabled={isClosing || state !== "ready"} autoComplete="off" />
                <button className="chat-attachment-button" type="button" disabled={isClosing || state !== "ready"} aria-label="Send a picture" onClick={() => fileInput.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="9" r="1.6" /><path d="m21 16-5-5-8 8" /></svg>
                </button>
                {message.trim() || photo ? (
                  <button className="chat-send-button" type="submit" disabled={isClosing || state !== "ready"} aria-label="Send message">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-8-7 18-3-7-8-3Z" /><path d="m11 14 4-4" /></svg>
                  </button>
                ) : (
                  <button className="chat-send-button chat-mic-button" type="button" disabled={isClosing || state !== "ready" || !voice.supported} aria-label="Record a voice message" title={voice.supported ? "Record a voice message (up to 1 minute)" : "Voice messages are not supported in this browser"} onClick={() => void startVoice()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                  </button>
                )}
              </>
            )}
          </form>
          {lightbox && (
            <div className="chat-lightbox" role="dialog" aria-label="Photo" onClick={() => setLightbox(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox} alt="Photo in chat" />
              <button type="button" aria-label="Close photo" onClick={() => setLightbox(null)}>×</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
