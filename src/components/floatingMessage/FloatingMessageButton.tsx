"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import "./FloatingMessageButton.css";
import Chat from "../modals/chat/Chat";

export default function FloatingMessageButton() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    return null;
  }

  return (
    <>
      {isChatOpen && <Chat onClose={() => setIsChatOpen(false)} />}
      <button
        className="floating-message-button"
        type="button"
        onClick={() => setIsChatOpen(true)}
        aria-label="Open TazaHat chat"
        aria-expanded={isChatOpen}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 4C8.82 4 3 9.17 3 15.55c0 3.04 1.3 5.79 3.4 7.8L4.8 28l5.2-2.36c1.83.94 3.9 1.47 6 1.47 7.18 0 13-5.17 13-11.56S23.18 4 16 4Z" />
        </svg>
      </button>
    </>
  );
}
