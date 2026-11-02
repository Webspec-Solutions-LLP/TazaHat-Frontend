"use client";

import { useBackClose } from "@/lib/backLayers";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import "./Chat.css";
import { useAuth } from "@/lib/auth";
import { chatOlderAction, chatOpenAction, chatReadAction, chatSendAction, chatTypingAction, type ChatMsg } from "@/app/chat-actions";

/** a message on screen: the saved one, or one still being sent / that failed (kept with its own id so a retry never duplicates it) */
type Row = ChatMsg & { state?: "sending" | "failed" };

export interface ChatProps {
  onClose: () => void;
  /** opened from a product page: the question starts with the product's name */
  product?: { id: string; name: string; image?: string };
  requestCloseRef?: { current: (() => void) | null };
}

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

/** WhatsApp-style support chat: signed-in customers only, the last 20 messages first, 10 more each time you scroll up, live replies, ticks and "typing...". */
export default function Chat({ onClose, product, requestCloseRef }: ChatProps) {
  const { user, ready, openLogin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [message, setMessage] = useState(() => (product ? `Hi, I have a question about ${product.name}: ` : ""));
  const [supportTyping, setSupportTyping] = useState(false);
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
        if (m.fromSupport) { setSupportTyping(false); if (document.visibilityState === "visible") void chatReadAction(); }
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

  const send = async (text: string, clientId = newId(), retry = false) => {
    const now = new Date().toISOString();
    if (!retry) setRows((cur) => [...cur, { id: `local-${clientId}`, threadId: "", text, fromSupport: false, createdAt: now, readAt: null, clientId, imageUrl: null, state: "sending" }]);
    else setRows((cur) => cur.map((r) => (r.clientId === clientId ? { ...r, state: "sending" } : r)));
    stickToEnd.current = true;
    const res = await chatSendAction(text, clientId);
    setRows((cur) => {
      if (!res.ok) return cur.map((r) => (r.clientId === clientId ? { ...r, state: "failed" } : r));
      const real = res.data;
      // the live copy may already have arrived: keep one
      const withoutLive = cur.filter((r) => !(r.id === real.id && r.clientId !== clientId));
      return withoutLive.map((r) => (r.clientId === clientId ? real : r));
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || isClosing) return;
    setMessage("");
    void chatTypingAction(false);
    void send(text);
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
        <button className="chat-collapse-button" type="button" onClick={closeChat} aria-label="Minimize chat">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
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
          <div className="chat-messages" ref={scroller} onScroll={onScroll} aria-live="polite" aria-relevant="additions text">
            {loadingOlder && <div className="chat-older" role="status">Loading earlier messages…</div>}
            {state === "loading" && <div className="chat-older" role="status">Loading your chat…</div>}
            {state === "error" && <div className="chat-older">Could not load the chat. <button type="button" className="chat-retry" onClick={() => void open()}>Try again</button></div>}
            {state === "ready" && rows.length === 0 && <div className="chat-empty"><strong>Say hello 👋</strong><span>Ask about an order, a product or delivery. Our team will reply here.</span></div>}
            {rows.map((m) => {
              const day = dayKey(m.createdAt);
              const divider = day !== lastDay ? <div className="chat-day-divider" key={`d-${day}-${m.id}`}><span>{dayLabel(m.createdAt)}</span></div> : null;
              lastDay = day;
              const mine = !m.fromSupport;
              return (
                <div className="chat-row" key={m.clientId ?? m.id} style={{ display: "contents" }}>
                  {divider}
                  <article id={`chat-message-${m.id}`} className={`chat-message chat-message--${mine ? "customer" : "team"}${m.state === "failed" ? " is-failed" : ""}`}>
                    {!mine && <span className="chat-message-author">TazaHat Support</span>}
                    <p>{m.text}</p>
                    <time>
                      {timeOf(m.createdAt)}
                      {mine && (m.state === "sending" ? <span className="chat-tick" aria-label="Sending">🕓</span> : m.state === "failed" ? null : <span className={`chat-tick${m.readAt ? " is-read" : ""}`} aria-label={m.readAt ? "Read" : "Sent"}>{m.readAt ? "✓✓" : "✓"}</span>)}
                    </time>
                    {m.state === "failed" && <button type="button" className="chat-retry" onClick={() => void send(m.text, m.clientId ?? newId(), true)}>Not sent · Tap to retry</button>}
                  </article>
                </div>
              );
            })}
            {supportTyping && <div className="chat-typing" role="status" aria-label="Support is typing"><span>Support is typing</span><i /><i /><i /></div>}
          </div>

          <form className="chat-composer" onSubmit={submit}>
            <label className="chat-sr-only" htmlFor="chat-message-input">Message to TazaHat support</label>
            <input ref={input} id="chat-message-input" value={message} onChange={(e) => onType(e.target.value)} placeholder="Type a message" maxLength={2000} disabled={isClosing || state !== "ready"} autoComplete="off" />
            <button className="chat-send-button" type="submit" disabled={!message.trim() || isClosing || state !== "ready"} aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-8-7 18-3-7-8-3Z" /><path d="m11 14 4-4" /></svg>
            </button>
          </form>
        </>
      )}
    </section>
  );
}
