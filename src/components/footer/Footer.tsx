"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "../navbar/Navbar";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./Footer.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface LanguageOption {
  code: SupportedLang;
  label: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা" },
];

export default function Footer() {
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
      if (stored === "en" || stored === "bn" || stored === "hi") {
        setCurrentLang(stored);
      }
    } catch {
      // Use fallback
    }

    const handleLanguageChange = (event: Event) => {
      const newLang = (event as CustomEvent<SupportedLang>).detail;
      if (newLang === "en" || newLang === "bn" || newLang === "hi") {
        setCurrentLang(newLang);
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  useEffect(() => {
    if (!isLangOpen) return;
    const handleClickOutside = (event: PointerEvent) => {
      if (!langRef.current?.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLangOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLangOpen]);

  const handleLanguageSelect = (code: SupportedLang) => {
    setCurrentLang(code);
    setIsLangOpen(false);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      window.dispatchEvent(
        new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: code })
      );
    } catch {
      // Ignore if localStorage is restricted
    }
  };

  const activeLangOption =
    LANGUAGES.find((item) => item.code === currentLang) || LANGUAGES[0];
  const t = textMap[currentLang] || englishText;

  return (
    <footer className="tazahat-footer" aria-label="Site footer">
      <div className="tazahat-footer-inner">
        {/* Top Section */}
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link href="/" className="footer-logo-link" aria-label={t.homeAria}>
              <span className="footer-brand-lockup">
                <Image
                  src="/images/logo.webp"
                  alt={t.logoAlt}
                  width={120}
                  height={52}
                  className="footer-logo-img"
                />
                <span className="footer-brand-name">
                  {t.brandName}<span>{t.brandNameHighlight}</span>
                </span>
              </span>
              <span className="footer-tagline">
                {t.brandTagline}
              </span>
            </Link>

            <p className="footer-desc">
              {t.brandDesc}
            </p>

            {/* Social Links */}
            <div className="footer-social-links" aria-label={t.socialLinksAria}>
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Facebook"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Instagram"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="YouTube"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="footer-links-grid">
            {/* Quick Links */}
            <div className="footer-links-col">
              <h3 className="footer-col-title">{t.quickLinksTitle}</h3>
              <ul className="footer-links-list">
                <li>
                  <Link href="/" className="footer-link">
                    {t.linkHome}
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="footer-link">
                    {t.linkProducts}
                  </Link>
                </li>
                <li>
                  <Link href="/myOrders" className="footer-link">
                    {t.linkMyOrders}
                  </Link>
                </li>
                <li>
                  <Link href="/priceList" className="footer-link">
                    {t.linkPriceList}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Need Help? */}
            <div className="footer-links-col">
              <h3 className="footer-col-title">{t.needHelpTitle}</h3>
              <ul className="footer-links-list">
                <li>
                  <Link href="/contactUs" className="footer-link">
                    {t.linkContactUs}
                  </Link>
                </li>
                <li>
                  <Link href="/aboutUs" className="footer-link">
                    {t.linkAboutUs}
                  </Link>
                </li>
                <li>
                  <Link href="/privacyPolicy" className="footer-link">
                    {t.linkPrivacyPolicy}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-seller-card">
            <div className="footer-seller-heading">
              <svg className="footer-store-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M10 26h44v32H10z" fill="#e7f2ff"/><path d="M7 26 14 8h36l7 18" fill="#8bc943"/><path d="m20 8-3 18m15-18v18M44 8l3 18" stroke="#fff" strokeWidth="7"/><path d="M7 26h50v6H7z" fill="#b5e278"/><path d="M16 39h12v19H16zM36 38h12v12H36z" fill="#08609e"/><path d="M6 58h52" stroke="#a3c9ec" strokeWidth="4"/></svg>
              <div><h3>{t.sellerTitle}</h3><p>{t.sellerDesc}</p></div>
            </div>
            <Link href="/sell-with-us" className="footer-sell-button">{t.sellerButton} <span aria-hidden="true">&rarr;</span></Link>
            <div className="footer-seller-links"><Link href="/seller-guidelines">{t.sellerGuidelines}</Link><Link href="/partnership">{t.partnershipProgram}</Link></div>
            <Image src="/images/category/category2.webp?v=transparent-2" alt="" width={120} height={120} unoptimized className="footer-seller-produce" />
          </div>
          <div className="footer-app-col">
            <h3 className="footer-col-title">{t.appTitle}</h3>
            <p>{t.appDescLine1}<br />{t.appDescLine2}</p>
            <div className="footer-play-badge">
              <Image src="/images/playstore_img.webp" alt={t.playStoreAlt} width={715} height={212} className="footer-play-image" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-bottom-copy">
            {t.copyright}
          </p>
          {/* Language Selector Dropdown */}
          <div className="footer-lang-selector" ref={langRef}>
            <button
              type="button"
              className={`footer-lang-trigger${isLangOpen ? " is-open" : ""}`}
              onClick={() => setIsLangOpen((prev) => !prev)}
              aria-expanded={isLangOpen}
              aria-haspopup="true"
              aria-label={t.selectLanguageAria}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="footer-lang-globe"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span className="footer-lang-selected">{activeLangOption.nativeName}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="footer-lang-chevron"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isLangOpen && (
              <div
                className="footer-lang-dropdown"
                role="menu"
                aria-label={t.languageSelectionAria}
              >
                {LANGUAGES.map((lang) => {
                  const isActive = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      role="menuitem"
                      className={`footer-lang-option${isActive ? " is-active" : ""}`}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <span className="footer-lang-option-label">
                        <span className="footer-lang-native">{lang.nativeName}</span>
                        {lang.code !== "en" && (
                          <span className="footer-lang-english">({lang.label})</span>
                        )}
                      </span>
                      {isActive && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="footer-lang-check"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <p className="footer-bottom-values">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="footer-heart-icon"
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{t.valueFreshFood}</span>
            <span>•</span>
            <span>{t.valueHealthyLife}</span>
            <span>•</span>
            <span>{t.valueHappyFamily}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
