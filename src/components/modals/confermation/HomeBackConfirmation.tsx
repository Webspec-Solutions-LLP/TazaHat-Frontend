"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { onBackWithoutLayer } from "@/lib/backLayers";
import "./HomeBackConfirmation.css";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./homeBackConfirmation.english.json";
import bengaliText from "./homeBackConfirmation.bengali.json";
import hindiText from "./homeBackConfirmation.hindi.json";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export default function HomeBackConfirmation() {
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const titleId = useId();
  const descId = useId();

  const restoreHomeEntry = useCallback(() => {
    window.history.pushState({ homeBackGuard: true }, "", window.location.href);
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      setIsOpen(false);
      return;
    }

    setCanGoBack(window.history.length > 1);
    restoreHomeEntry();

    // Back with nothing open on top: ask before leaving. (A popup or side panel that is open takes the Back first, see lib/backLayers.ts.)
    const handleBack = () => {
      setCanGoBack(true);
      setIsOpen(true);
      restoreHomeEntry();
    };

    return onBackWithoutLayer(handleBack);
  }, [pathname, restoreHomeEntry]);

  const closeModal = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
    const duration = reduceMotion ? 0 : isMobile ? 400 : 250;
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, duration);
  }, [isClosing]);

  // Lock scroll across mobile, tablet & desktop + handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    // Robust scroll locking for iOS, Android, Tablets, and Desktop
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // Intercept touch drag on mobile & tablet background
    const preventBackgroundTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow scrolling inside the modal card if the content overflows on small heights
      if (target && target.closest(".home-back-card")) {
        const card = target.closest(".home-back-card") as HTMLElement;
        if (card.scrollHeight > card.clientHeight) {
          return;
        }
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchmove", preventBackgroundTouch, { passive: false });

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);

      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", preventBackgroundTouch);
    };
  }, [isOpen, closeModal]);

  const confirmExit = () => {
    if (isClosing) return;
    setIsClosing(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
    const duration = reduceMotion ? 0 : isMobile ? 400 : 250;
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      if (canGoBack && window.history.length > 1) {
        window.history.go(-2);
      } else {
        window.history.back();
      }
    }, duration);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`home-back-backdrop${isClosing ? " is-closing" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget && e.cancelable) {
          e.preventDefault();
        }
      }}
      role="presentation"
    >
      <div
        className="home-back-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        {/* Mobile Bottom Sheet Grabber Handle */}
        <div className="home-back-drag-handle" aria-hidden="true" />

        {/* Glowing Top Edge & Ambient Radial Light */}
        <div className="home-back-top-glow" aria-hidden="true" />
        <div className="home-back-ambient-bg" aria-hidden="true" />

        {/* Close Button */}
        <button
          type="button"
          className="home-back-close"
          onClick={closeModal}
          aria-label={t.closeAria}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Hero Interactive Badge */}
        <div className="home-back-hero" aria-hidden="true">
          <div className="home-back-hero-halo" />
          <div className="home-back-hero-badge">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="home-back-hero-leaf">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 2C13.5 2 9 6 8 11.5c-1 5.5 3 9.5 8.5 8.5C22 19 24 12 24 8.5 24 5 21 2 17.5 2zm-1.8 14.2c-3.1.6-5.4-1.7-4.8-4.8.6-3.1 3.5-5.9 6.6-6.4 3.1-.6 5.4 1.7 4.8 4.8-.6 3.1-3.5 5.9-6.6 6.4z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Eyebrow Pill */}
        <div className="home-back-eyebrow-wrap">
          <span className="home-back-eyebrow">
            <span className="home-back-pulse-dot" aria-hidden="true" />
            {t.badge}
          </span>
        </div>

        {/* Headline & Description */}
        <h2 id={titleId} className="home-back-title">
          {t.title}
        </h2>
        <p id={descId} className="home-back-desc">
          {t.desc}
        </p>

        {/* 3 Perks Micro-Cards */}
        <div className="home-back-perks" aria-hidden="true">
          <div className="home-back-perk-item">
            <div className="home-back-perk-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="home-back-perk-title">{t.perks[0].title}</span>
            <span className="home-back-perk-sub">{t.perks[0].sub}</span>
          </div>

          <div className="home-back-perk-item">
            <div className="home-back-perk-icon-wrap" style={{ color: "#16a34a", background: "#f0fdf4" }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="home-back-perk-title">{t.perks[1].title}</span>
            <span className="home-back-perk-sub">{t.perks[1].sub}</span>
          </div>

          <div className="home-back-perk-item">
            <div className="home-back-perk-icon-wrap" style={{ color: "#d97706", background: "#fffbeb" }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8l-8 8" />
                <circle cx="9" cy="9" r="1" fill="currentColor" />
                <circle cx="15" cy="15" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="home-back-perk-title">{t.perks[2].title}</span>
            <span className="home-back-perk-sub">{t.perks[2].sub}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="home-back-actions">
          <button
            type="button"
            className="home-back-btn home-back-stay-btn"
            onClick={closeModal}
          >
            <span>{t.stayBtn}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <button
            type="button"
            className="home-back-btn home-back-leave-btn"
            onClick={confirmExit}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t.leaveBtn}</span>
          </button>
        </div>

        {/* Security & Reassurance Footer Note */}
        <div className="home-back-footer-note" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t.savedNote}</span>
        </div>
      </div>
    </div>
  );
}
