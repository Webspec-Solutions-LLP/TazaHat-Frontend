"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import "./PrivacyPolicy.css";
import englishData from "./english.json";
import bengaliData from "./bengali.json";

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");

  const data = lang === "bn" ? bengaliData : englishData;

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return data.sections;
    const q = searchQuery.toLowerCase();
    return data.sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.summary.toLowerCase().includes(q) ||
        sec.content.some((p) => p.toLowerCase().includes(q))
    );
  }, [data.sections, searchQuery]);

  // Set active section on click and smooth scroll with navbar offset
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Observe active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = data.sections
        .map((s) => document.getElementById(s.id))
        .filter((el): el is HTMLElement => el !== null);

      const scrollPosition = window.pageYOffset + 140;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el.offsetTop <= scrollPosition) {
          setActiveSection(el.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data.sections]);

  return (
    <div className="privacy-page no-scrollbar">
      {/* 1. COMPACT HERO / HEADER */}
      <header className="privacy-hero">
        <div className="privacy-container">
          <div className="privacy-hero-inner">
            <div className="privacy-hero-copy">
              <div className="privacy-badge">
                <span className="privacy-pulse" />
                <span>{data.pageBadge}</span>
              </div>
              <h1 className="privacy-title">{data.pageTitle}</h1>
              <p className="privacy-subtitle">{data.pageSubtitle}</p>
              <div className="privacy-meta-row">
                <span className="privacy-meta-tag">{data.lastUpdated}</span>
                <span className="privacy-meta-tag">{data.effectiveDate}</span>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="privacy-lang-box">
              <span className="privacy-lang-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {data.languageLabel}
              </span>
              <div className="privacy-lang-toggle">
                <button
                  type="button"
                  className={`privacy-lang-btn ${lang === "en" ? "is-active" : ""}`}
                  onClick={() => setLang("en")}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`privacy-lang-btn ${lang === "bn" ? "is-active" : ""}`}
                  onClick={() => setLang("bn")}
                >
                  বাংলা
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SPLIT LAYOUT (LEFT POINTS + RIGHT DETAILS) */}
      <main className="privacy-main">
        <div className="privacy-container">
          <div className="privacy-layout">
            {/* LEFT SIDEBAR: POINTING SYSTEM */}
            <aside className="privacy-sidebar-col no-scrollbar">
              <div className="privacy-sidebar-sticky no-scrollbar">
                {/* Search Bar */}
                <div className="privacy-search-wrap">
                  <svg className="privacy-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="privacy-search-input"
                    placeholder={data.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="privacy-search-clear"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Sidebar Navigation Header */}
                <div className="privacy-nav-head">
                  <span className="privacy-nav-title">{data.quickNavTitle}</span>
                  <span className="privacy-nav-count">{filteredSections.length}</span>
                </div>

                {/* Points List */}
                <nav className="privacy-nav-list no-scrollbar" aria-label="Privacy Policy Points">
                  {filteredSections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        className={`privacy-nav-item ${isActive ? "is-active" : ""}`}
                        onClick={() => scrollToSection(sec.id)}
                      >
                        <span className="privacy-nav-num">{sec.number}</span>
                        <span className="privacy-nav-text">{sec.title}</span>
                        <svg className="privacy-nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    );
                  })}
                  {filteredSections.length === 0 && (
                    <div className="privacy-nav-empty">{data.noResultsText}</div>
                  )}
                </nav>

                {/* Help Desk Mini Card */}
                <div className="privacy-help-card">
                  <h4 className="privacy-help-title">{data.contactHelpTitle}</h4>
                  <p className="privacy-help-desc">{data.contactHelpDesc}</p>
                  <a href="mailto:privacy@tazahaat.in" className="privacy-help-link">
                    <span>{data.contactHelpBtn}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
              </div>
            </aside>

            {/* RIGHT CONTENT PANE: DETAILS */}
            <section className="privacy-content-pane no-scrollbar">
              {filteredSections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className={`privacy-section-card ${activeSection === sec.id ? "is-focused" : ""}`}
                >
                  <div className="privacy-section-header">
                    <span className="privacy-section-pill">{sec.number}</span>
                    <h2 className="privacy-section-title">{sec.title}</h2>
                  </div>

                  {sec.summary && (
                    <div className="privacy-section-summary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <p>{sec.summary}</p>
                    </div>
                  )}

                  <div className="privacy-section-body">
                    {sec.content.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {sec.highlights && sec.highlights.length > 0 && (
                    <div className="privacy-highlights-box">
                      <div className="privacy-highlights-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Key Safeguards</span>
                      </div>
                      <ul className="privacy-highlights-list">
                        {sec.highlights.map((hItem, hIdx) => (
                          <li key={hIdx}>
                            <span className="privacy-check-bullet" />
                            <span>{hItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}

              {/* Bottom Support Banner */}
              <div className="privacy-bottom-card">
                <div className="privacy-bottom-content">
                  <h3>Still need help regarding your data?</h3>
                  <p>Our Data Protection team in Agartala is ready to assist you with compliance inquiries or account requests.</p>
                </div>
                <div className="privacy-bottom-actions">
                  <a href="mailto:privacy@tazahaat.in" className="privacy-btn-contact">
                    privacy@tazahaat.in
                  </a>
                  <Link href="/contactUs" className="privacy-btn-help">
                    Help Center &amp; Support
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
