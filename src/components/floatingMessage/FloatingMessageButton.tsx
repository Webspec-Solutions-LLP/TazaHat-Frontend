"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import "./FloatingMessageButton.css";
import Chat from "../modals/chat/Chat";

export default function FloatingMessageButton() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatCloseRef = useRef<(() => void) | null>(null);

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
      <button
        className={`floating-message-button${isChatOpen ? " is-chat-open" : ""}`}
        type="button"
        onClick={handleToggle}
        aria-label={isChatOpen ? "Close TazaHat chat" : "Open TazaHat chat"}
        aria-expanded={isChatOpen}
      >
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
