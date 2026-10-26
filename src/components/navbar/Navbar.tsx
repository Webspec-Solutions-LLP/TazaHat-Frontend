"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Cart from "../modals/cart/Cart";
import Location from "../modals/location/Location";
import Login from "../modals/login/Login";
import "./Navbar.css";

interface NavbarProps {
  cartCount?: number;
  deliveryLocation?: string;
  onSearch?: (query: string) => void;
}

export default function Navbar({
  cartCount = 0,
  deliveryLocation = "Kolkata, West Bengal",
  onSearch,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAccountOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header
      className="tazahat-navbar"
      style={{ backgroundColor: "#00366b", color: "#ffffff" }}
    >
      <div className="tazahat-navbar-container">
        {/* Left: Brand Logo & Tagline */}
        <div className="navbar-brand">
          <Link href="/" className="navbar-logo-link" aria-label="TazaHaat Home">
            <Image
              src="/images/logo.png"
              alt="TazaHaat Logo"
              width={48}
              height={48}
              sizes="48px"
              priority
              className="navbar-logo-img"
            />
            <span className="navbar-brand-copy">
              <span className="navbar-brand-name">Taza<span>Haat</span></span>
              <span className="navbar-tagline">
                Freshness Delivered
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form className="navbar-search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="navbar-search-box">
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search for fish, meat, vegetables, fruits, dairy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            <button type="submit" className="navbar-search-btn" aria-label="Submit search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </form>

        {/* Deliver-To / Location Selector */}
        <button type="button" className="navbar-location" aria-label="Select delivery location" onClick={() => setIsLocationOpen(true)}>
          <div className="navbar-location-icon-wrap">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="navbar-location-text">
            <span className="navbar-location-label">Deliver to</span>
            <div className="navbar-location-val-wrap">
              <span className="navbar-location-city">{deliveryLocation}</span>
              <svg
                className="navbar-location-arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </button>

        {/* Right Navigation Actions */}
        <nav className="navbar-actions" aria-label="User navigation">
          {/* Account */}
          <div className="navbar-account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="navbar-action-item"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              onClick={() => setIsAccountOpen(open => !open)}
            >
              <div className="navbar-action-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="navbar-action-label">Account</span>
            </button>
            <div className={`navbar-account-dropdown${isAccountOpen ? " is-open" : ""}`} role="menu" aria-label="Account options" aria-hidden={!isAccountOpen}>
              <button type="button" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => { setIsAccountOpen(false); setIsLoginOpen(true); }}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/><path d="M10 16l4-4-4-4M14 12H3"/></svg></span>Login
              </button>
              <Link href="/wishlist" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></span>Wishlist
              </Link>
              <Link href="/myOrders" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12l2 3v15H4V6l2-3Z"/><path d="M4 6h16M9 10v7l3-2 3 2v-7"/></svg></span>My Orders
              </Link>
              <Link href="/account" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20v-1.2a7 7 0 0 1 14 0V20Z"/></svg></span>My Profile
              </Link>
            </div>
          </div>

          {/* Cart */}
          <button
            type="button"
            className="navbar-action-item"
            aria-label={`Cart with ${cartCount} items`}
            onClick={() => setIsCartOpen(true)}
          >
            <div className="navbar-action-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="navbar-cart-badge">{cartCount}</span>
            </div>
            <span className="navbar-action-label">Cart</span>
          </button>
        </nav>
      </div>

      {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} />}
      {isLocationOpen && <Location deliveryLocation={deliveryLocation} onClose={() => setIsLocationOpen(false)} onLogin={() => { setIsLocationOpen(false); setIsLoginOpen(true); }} />}
      {isLoginOpen && <Login onClose={() => setIsLoginOpen(false)} />}
    </header>
  );
}
