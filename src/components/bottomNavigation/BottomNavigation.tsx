"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./BottomNavigation.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

const itemIcons: Record<string, React.ReactNode> = {
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />,
  delivery: (
    <>
      <path d="M2 6h12v11H2z" />
      <path d="M14 10h4l4 4v3h-8z" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  cart: (
    <>
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6" />
      <circle cx="10" cy="21" r="1" />
      <circle cx="18" cy="21" r="1" />
    </>
  ),
};

export default function BottomNavigation() {
  const [currentLang] = useLanguage();
  const pathname = usePathname();
  const { user, ready, openLogin } = useAuth();
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY);
      const scrollDifference = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 8) {
        setIsHidden(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (Math.abs(scrollDifference) < 5) return;
      setIsHidden(scrollDifference > 0);
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = Math.max(0, window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const t = textMap[currentLang] || englishText;

  return (
    <nav className={`mobile-bottom-navigation${isHidden ? " is-hidden" : ""}`} aria-label={t.navAriaLabel} aria-hidden={isHidden} lang={t.language}>
      {t.items.map(({ id, label, href }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const icon = itemIcons[id];
        const content = (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
            <span>{label}</span>
          </>
        );

        // not signed in: Account opens the login popup instead of a page that needs a login
        if (id === "account" && ready && !user) {
          return (
            <button className="mobile-bottom-navigation-item" type="button" key={id} aria-label={label} tabIndex={isHidden ? -1 : undefined} onClick={() => openLogin()}>
              {content}
            </button>
          );
        }

        if (id === "cart" || href === "/cart") {
          return (
            <button
              className={`mobile-bottom-navigation-item${isActive ? " is-active" : ""}`}
              type="button"
              key={id}
              aria-label={t.openCartAria}
              tabIndex={isHidden ? -1 : undefined}
              onClick={() => window.dispatchEvent(new Event("tazahat:open-cart"))}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            className={`mobile-bottom-navigation-item${isActive ? " is-active" : ""}`}
            href={href}
            key={id}
            aria-current={isActive ? "page" : undefined}
            tabIndex={isHidden ? -1 : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
