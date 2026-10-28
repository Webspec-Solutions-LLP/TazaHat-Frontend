"use client";

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
  return (
    <nav className="mobile-bottom-navigation" aria-label="Mobile navigation">
      {items.map(({ label, href, icon }) => (
        <Link className={`mobile-bottom-navigation-item${(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? " is-active" : ""}`} href={href} key={label} aria-current={(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "page" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
