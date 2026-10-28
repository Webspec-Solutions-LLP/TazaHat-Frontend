"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Feedback from "../modals/FeedbackForm/Feedback";
import "./FeedbackButton.css";

export default function FeedbackButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return null;

  return (
    <>
      <button
        className="feedback-floating-button"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Share feedback"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2 1.2-4.3A7.5 7.5 0 1 1 20 11.5Z" />
          <path d="M8 10h8M8 14h5" />
        </svg>
        <span>Feedback</span>
      </button>
      {isOpen && <Feedback onClose={() => setIsOpen(false)} />}
    </>
  );
}
