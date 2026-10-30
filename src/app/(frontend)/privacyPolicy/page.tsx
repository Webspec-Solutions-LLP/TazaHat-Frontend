"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import "./PrivacyPolicy.css";
import englishData from "./english.json";
import bengaliData from "./bengali.json";

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");

  const rightPaneRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const data = lang === "bn" ? bengaliData : englishData;

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Set active section on click and smooth scroll right pane
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const container = rightPaneRef.current;
    const element = document.getElementById(id);

    if (container && element) {
      const isDesktop = window.innerWidth > 875;
      if (isDesktop) {
        const containerTop = container.getBoundingClientRect().top;
        const elementTop = element.getBoundingClientRect().top;
        const targetScroll = container.scrollTop + (elementTop - containerTop) - 6;
        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      } else {
        const navbarHeight = 85;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
    if (window.innerWidth <= 875) setIsSidebarOpen(false);
  };

  // Scroll spy on right pane (desktop) and window (mobile)
  useEffect(() => {
    const container = rightPaneRef.current;

    const handleRightPaneScroll = () => {
      if (!container) return;
      const sectionElements = data.sections
        .map((s) => document.getElementById(s.id))
        .filter((el): el is HTMLElement => el !== null);

      const containerTop = container.getBoundingClientRect().top;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 45) {
          setActiveSection(el.id);
          break;
        }
      }
    };

    const handleWindowScroll = () => {
      if (window.innerWidth > 875) return;
      const sectionElements = data.sections
        .map((s) => document.getElementById(s.id))
        .filter((el): el is HTMLElement => el !== null);

      const scrollPosition = window.pageYOffset + 130;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el.offsetTop <= scrollPosition) {
          setActiveSection(el.id);
          break;
        }
      }
    };

    if (container) {
      container.addEventListener("scroll", handleRightPaneScroll, { passive: true });
    }
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleRightPaneScroll);
      }
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [data.sections]);

  return (
    <div className="privacy-page no-scrollbar">
      {/* 1. COMPACT HERO HEADER */}
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

            {/* Language Dropdown */}
            <div className="privacy-lang-box" ref={dropdownRef}>
              <span className="privacy-lang-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {data.languageLabel}
              </span>
              <div className="privacy-lang-dropdown">
                <button
                  type="button"
                  className="privacy-lang-trigger"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  aria-haspopup="true"
                  aria-expanded={isLangOpen}
                >
                  <span className="privacy-lang-current">
                    {lang === "en" ? "English" : "বাংলা (Bengali)"}
                  </span>
                  <svg
                    className={`privacy-lang-chevron ${isLangOpen ? "is-open" : ""}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isLangOpen && (
                  <div className="privacy-lang-menu no-scrollbar">
                    <button
                      type="button"
                      className={`privacy-lang-item ${lang === "en" ? "is-active" : ""}`}
                      onClick={() => {
                        setLang("en");
                        setIsLangOpen(false);
                      }}
                    >
                      <span>English</span>
                      {lang === "en" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`privacy-lang-item ${lang === "bn" ? "is-active" : ""}`}
                      onClick={() => {
                        setLang("bn");
                        setIsLangOpen(false);
                      }}
                    >
                      <span>বাংলা (Bengali)</span>
                      {lang === "bn" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="privacy-sidebar-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open policy navigation"
          aria-expanded={isSidebarOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* 2. FIXED LEFT (POINTS) + SCROLLABLE RIGHT (DETAILS) */}
      <main className="privacy-main">
        <button
          type="button"
          className={`privacy-sidebar-backdrop${isSidebarOpen ? " is-open" : ""}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close policy navigation"
          tabIndex={isSidebarOpen ? 0 : -1}
        />
        <div className="privacy-container">
          <div className="privacy-layout">
            {/* FIXED LEFT SIDEBAR */}
            <aside className={`privacy-sidebar-col no-scrollbar${isSidebarOpen ? " is-open" : ""}`}>
              <div className="privacy-sidebar-fixed no-scrollbar">
                {/* Search Bar */}
                <div className="privacy-search-wrap">
                  <svg className="privacy-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

                {/* Navigation Header */}
                <div className="privacy-nav-head">
                  <span className="privacy-nav-title">{data.quickNavTitle}</span>
                  <span className="privacy-nav-count">{filteredSections.length}</span>
                  <button type="button" className="privacy-sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close policy navigation">×</button>
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
                        <svg className="privacy-nav-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    );
                  })}
                  {filteredSections.length === 0 && (
                    <div className="privacy-nav-empty">{data.noResultsText}</div>
                  )}
                </nav>

                {/* Quick Help Card */}
                <div className="privacy-help-card">
                  <h4 className="privacy-help-title">{data.contactHelpTitle}</h4>
                  <p className="privacy-help-desc">{data.contactHelpDesc}</p>
                  <a href="mailto:privacy@tazahaat.in" className="privacy-help-link">
                    <span>{data.contactHelpBtn}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
              </div>
            </aside>

            {/* SCROLLABLE RIGHT CONTENT PANE */}
            <section className="privacy-content-pane no-scrollbar" ref={rightPaneRef}>
              <div className="privacy-content-scrollable no-scrollbar">
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
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
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
