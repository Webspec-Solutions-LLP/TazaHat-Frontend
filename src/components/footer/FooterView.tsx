"use client";

import { BrandWords, useBrand } from "@/lib/brand";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishTextRaw from "./english.json";
import bengaliTextRaw from "./bengali.json";
import hindiText from "./hindi.json";
import type { AppLink } from "@/lib/server/api";

type AppLinks = { android: AppLink; ios: AppLink };
import "./Footer.css";
import { brandify } from "@/lib/brandText";
const englishText = brandify(englishTextRaw);
const bengaliText = brandify(bengaliTextRaw);

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

function AppStoreBadge() {
  return (
    <svg className="footer-play-image footer-ios-badge" viewBox="0 0 150 45" role="img" aria-label="Download on the App Store">
      <rect x="0.5" y="0.5" width="149" height="44" rx="7.5" fill="#000" stroke="#a6a6a6" />
      <path transform="translate(11 9) scale(.95)" fill="#fff" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      <text x="40" y="17" fill="#fff" fontSize="8" fontFamily="-apple-system, Helvetica, Arial, sans-serif">Download on the</text>
      <text x="39" y="34" fill="#fff" fontSize="17" fontWeight="600" fontFamily="-apple-system, Helvetica, Arial, sans-serif">App Store</text>
    </svg>
  );
}

/** one store button: a link when the CRM has the address, "Coming soon" when it has not, nothing when it is switched off */
function StoreButton({ link, label, children }: { link: AppLink; label: string; children: React.ReactNode }) {
  if (link.state === "hidden") return null;
  if (link.state === "link") return <a className="footer-play-badge" href={link.url} target="_blank" rel="noopener noreferrer" aria-label={label}>{children}</a>;
  return <span className="footer-play-badge is-soon" aria-label={`${label} - coming soon`}>{children}<span className="footer-soon-tag">Coming soon</span></span>;
}

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

export default function FooterView({ apps, legal = [], bottom = [] }: { apps: AppLinks; legal?: { slug: string; title: string }[]; bottom?: { slug: string; title: string }[] }) {
  const [currentLang, setSiteLanguage] = useLanguage();
  const brand = useBrand();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

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
    setSiteLanguage(code);
    setIsLangOpen(false);
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
                  src={brand.logo || "/images/logo.webp"}
                  unoptimized={!(brand.logo || "/images/logo.webp").startsWith("/images/")}
                  alt={t.logoAlt}
                  width={120}
                  height={52}
                  className="footer-logo-img"
                />
                <span className="footer-brand-name">
                  <BrandWords name={brand.name} />
                </span>
              </span>
              <span className="footer-tagline">
                {brand.tagline || t.brandTagline}
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
            {/* Language: under the social links */}
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
          </div>

          {/* Links Grid: only what the CRM has set */}
          {legal.length > 0 && <div className="footer-links-grid">
            {/* Need Help? */}
            <div className="footer-links-col">
              <h3 className="footer-col-title">{t.needHelpTitle}</h3>
              <ul className="footer-links-list footer-links-list--help">
                {legal.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/legal/${d.slug}`} className="footer-link">
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>}
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
            <div className="footer-app-info">
              <h3 className="footer-col-title">{t.appTitle}</h3>
              <p>{t.appDescLine1}<br />{t.appDescLine2}</p>
            </div>
            {(apps.android.state !== "hidden" || apps.ios.state !== "hidden") && (
              <div className="footer-store-buttons">
                <StoreButton link={apps.android} label={t.playStoreAlt}><Image src="/images/playstore.webp" alt={t.playStoreAlt} width={756} height={227} className="footer-play-image" /></StoreButton>
                <StoreButton link={apps.ios} label="Download on the App Store"><AppStoreBadge /></StoreButton>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-bottom-copy">
            {t.copyright}
          </p>
          {bottom.length > 0 ? (
            <nav className="footer-bottom-links" aria-label="Contact and about">
              {bottom.map((d, i) => (
                <span key={d.slug}>
                  {i > 0 && <span className="footer-bottom-dot" aria-hidden="true">•</span>}
                  <Link href={`/legal/${d.slug}`}>{d.title}</Link>
                </span>
              ))}
            </nav>
          ) : (
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
          )}
        </div>
      </div>
    </footer>
  );
}
