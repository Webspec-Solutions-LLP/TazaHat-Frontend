"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import "./FloatingMessageButton.css";
import Chat, { OPEN_CHAT_EVENT } from "../modals/chat/Chat";
import { useAuth } from "@/lib/auth";
import { chatUnreadAction } from "@/app/chat-actions";

export default function FloatingMessageButton() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatCloseRef = useRef<(() => void) | null>(null);
  const { user } = useAuth();
  // replies that arrived while the chat is closed: a small red count on the button (the chat itself marks them read)
  const [unread, setUnread] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openRef = useRef(false);
  openRef.current = isChatOpen;
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let live = true;
    void chatUnreadAction().then((n) => { if (live) setUnread(n); });
    const onChat = (e: Event) => {
      const d = (e as CustomEvent<{ kind: string; message?: { fromSupport: boolean; text: string; voiceUrl: string | null; imageUrl: string | null } }>).detail;
      // the chat was read on another device (the app): no count, no blinking here either
      if (d.kind === "seen") { setUnread(0); setPreview(null); return; }
      if (d.kind === "message" && d.message?.fromSupport && !openRef.current) {
        setUnread((n) => n + 1);
        // a short peek at what support wrote; one bubble per conversation, the newest replaces the older
        setPreview(d.message.voiceUrl ? "🎤 Voice message" : d.message.imageUrl ? "📷 Photo" : d.message.text.slice(0, 90));
        clearTimeout(previewTimer.current);
        previewTimer.current = setTimeout(() => setPreview(null), 7000);
      }
    };
    window.addEventListener("tazahat:chat", onChat);
    return () => { live = false; window.removeEventListener("tazahat:chat", onChat); };
  }, [user]);
  useEffect(() => { if (isChatOpen) { setUnread(0); setPreview(null); } }, [isChatOpen]);
  useEffect(() => {
    const openChat = () => setIsChatOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, []);
  // a push notification of a reply opens the app on /?chat=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("chat") === "1") setIsChatOpen(true);
  }, []);

  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    return null;
  }

  const handleToggle = () => {
    if (isChatOpen) {
      if (chatCloseRef.current) {
        chatCloseRef.current();
      } else {
        setIsChatOpen(false);
      }
    } else {
      setIsChatOpen(true);
    }
  };

  return (
    <>
      {isChatOpen && (
        <Chat
          onClose={() => setIsChatOpen(false)}
          requestCloseRef={chatCloseRef}
        />
      )}
      {preview && !isChatOpen && <button type="button" className="floating-message-peek" onClick={handleToggle}><strong>TazaHat Support{unread > 1 ? ` · ${unread} new` : ""}</strong><span>{preview}</span></button>}
      <button
        className={`floating-message-button${isChatOpen ? " is-chat-open" : ""}${unread > 0 && !isChatOpen ? " has-unread" : ""}`}
        type="button"
        onClick={handleToggle}
        aria-label={isChatOpen ? "Close TazaHat chat" : "Open TazaHat chat"}
        aria-expanded={isChatOpen}
      >
        {unread > 0 && !isChatOpen && <span className="floating-message-badge" aria-label={`${unread} new messages`}>{unread > 9 ? "9+" : unread}</span>}
        <span className="floating-message-icon-wrapper" aria-hidden="true">
          <svg
            viewBox="0 0 32 32"
            className="floating-message-icon floating-message-icon--chat"
          >
            <path d="M16 4C8.82 4 3 9.17 3 15.55c0 3.04 1.3 5.79 3.4 7.8L4.8 28l5.2-2.36c1.83.94 3.9 1.47 6 1.47 7.18 0 13-5.17 13-11.56S23.18 4 16 4Z" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            className="floating-message-icon floating-message-icon--close"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>
      </button>
    </>
  );
}
