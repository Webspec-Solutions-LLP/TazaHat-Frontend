"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./BottomNavigation.css";

const items = [
  { label: "Home", href: "/", icon: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></> },
  { label: "Delivery", href: "/deliveryService", icon: <><path d="M2 6h12v11H2z"/><path d="M14 10h4l4 4v3h-8z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></> },
  { label: "Account", href: "/myprofile", icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></> },
  { label: "Cart", href: "/cart", icon: <><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></> },
];

export default function BottomNavigation() {
  const pathname = usePathname();
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

  return (
    <nav className={`mobile-bottom-navigation${isHidden ? " is-hidden" : ""}`} aria-label="Mobile navigation" aria-hidden={isHidden}>
      {items.map(({ label, href, icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const content = <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
          <span>{label}</span>
        </>;

        if (label === "Cart") {
          return (
            <button
              className={`mobile-bottom-navigation-item${isActive ? " is-active" : ""}`}
              type="button"
              key={label}
              aria-label="Open cart"
              tabIndex={isHidden ? -1 : undefined}
              onClick={() => window.dispatchEvent(new Event("tazahat:open-cart"))}
            >
              {content}
            </button>
          );
        }

        return (
          <Link className={`mobile-bottom-navigation-item${isActive ? " is-active" : ""}`} href={href} key={label} aria-current={isActive ? "page" : undefined} tabIndex={isHidden ? -1 : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
