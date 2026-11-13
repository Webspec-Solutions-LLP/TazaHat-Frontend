"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import englishTextRaw from "./english.json";
import bengaliTextRaw from "./bengali.json";
import hindiText from "./hindi.json";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "@/components/navbar/Navbar";
import "./About.css";
import { brandify } from "@/lib/brandText";
const englishText = brandify(englishTextRaw);
const bengaliText = brandify(bengaliTextRaw);

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

const pillarIcons = [
  (
    <svg key="icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  (
    <svg key="icon-price" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 6v12" />
    </svg>
  ),
  (
    <svg key="icon-cold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>
  ),
  (
    <svg key="icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
];

export default function AboutUsPage() {
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");

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

  const t = textMap[currentLang] || englishText;

  const [activeTab, setActiveTab] = useState("mission");
  const currentTab = t.tabContent.find((tab) => tab.id === activeTab) || t.tabContent[0];

  return (
    <div className="about-tech-page" lang={t.language}>
      {/* 1. ADVANCED BLUE HERO */}
      <section className="about-tech-hero">
        <div className="about-tech-container">
          <div className="about-hero-layout">
            <div className="about-hero-text">
              <div className="about-hero-badge">
                <span className="about-pulse-dot" />
                <span>{t.heroBadge}</span>
              </div>
              <h1 className="about-hero-title">
                {t.heroTitlePrefix}<em>{t.heroTitleHighlight}</em>{t.heroTitleSuffix}
              </h1>
              <p className="about-hero-sub">{t.heroSub}</p>
              <div className="about-hero-actions">
                <Link href="/products" className="about-btn-primary">
                  <span>{t.heroBtnPrimary}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/contactUs" className="about-btn-secondary">
                  <span>{t.heroBtnSecondary}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V8H8" />
                  </svg>
                </Link>
              </div>

              <div className="about-hero-trust-chips">
                <div className="about-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{t.heroTrustFormalin}</span>
                </div>
                <div className="about-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{t.heroTrustDirect}</span>
                </div>
                <div className="about-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{t.heroTrustInspection}</span>
                </div>
              </div>
            </div>

            <div className="about-hero-media">
              <div className="about-hero-media-wrapper">
                <Image
                  src="/images/banner7.webp"
                  alt={t.heroImgAlt}
                  fill
                  priority
                  className="about-hero-img"
                  sizes="(max-width: 990px) 100vw, 580px"
                />
                <div className="about-media-overlay" />

                {/* Floating telemetry HUD elements */}
                <div className="about-hud-card about-hud-top">
                  <div className="about-hud-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m12 6 4 6-4 6" /></svg>
                  </div>
                  <div>
                    <span className="about-hud-label">{t.hudTelemetryLabel}</span>
                    <strong className="about-hud-val">{t.hudTelemetryVal}</strong>
                  </div>
                </div>

                <div className="about-hud-card about-hud-bottom">
                  <div className="about-hud-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h12M6 8h12M6 12h8a4 4 0 0 0 0-8M6 12l9 9" /></svg>
                  </div>
                  <div>
                    <span className="about-hud-label">{t.hudGrowerLabel}</span>
                    <strong className="about-hud-val">{t.hudGrowerVal}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & IMPACT METRICS STRIP */}
      <section className="about-metrics-strip">
        <div className="about-tech-container">
          <div className="about-metrics-grid">
            {t.metrics.map((metric, idx) => (
              <div className="about-metric-card" key={idx}>
                <div className="about-metric-header">
                  <span className="about-metric-num">{metric.num}</span>
                  <span className="about-metric-tag">{metric.tag}</span>
                </div>
                <h3 className="about-metric-label">{metric.label}</h3>
                <p className="about-metric-sub">{metric.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE TABS: CORE FOUNDATIONS & TECHNOLOGY */}
      <section className="about-tabs-section">
        <div className="about-tech-container">
          <div className="about-section-intro">
            <span className="about-badge-pill">{t.tabsBadge}</span>
            <h2 className="about-section-heading">{t.tabsHeading}</h2>
            <p className="about-section-desc">{t.tabsDesc}</p>
          </div>

          <div className="about-tab-nav">
            {t.tabContent.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`about-tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="about-tab-panel">
            <div className="about-panel-left">
              <span className="about-panel-badge">{currentTab.badge}</span>
              <h3 className="about-panel-title">{currentTab.title}</h3>
              <p className="about-panel-lead">{currentTab.lead}</p>

              <div className="about-panel-points">
                {currentTab.points.map((pt, idx) => (
                  <div className="about-point-row" key={idx}>
                    <div className="about-point-bullet">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div>
                      <strong>{pt.title}</strong>
                      <p>{pt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-panel-right">
              <div className="about-stat-display">
                <span className="about-stat-tag">{currentTab.highlightTag}</span>
                <div className="about-stat-big">{currentTab.metricValue}</div>
                <div className="about-stat-desc">{currentTab.metricLabel}</div>
                <div className="about-stat-divider" />
                <ul className="about-stat-perks">
                  {t.tabPerks.map((perk, idx) => (
                    <li key={idx}>
                      <span className="about-check-dot" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link href="/products" className="about-stat-link">
                  {t.statLinkText} <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 4-STEP PRECISION LIFECYCLE */}
      <section className="about-lifecycle-section">
        <div className="about-tech-container">
          <div className="about-section-intro">
            <span className="about-badge-pill">{t.lifecycleBadge}</span>
            <h2 className="about-section-heading">{t.lifecycleHeading}</h2>
            <p className="about-section-desc">{t.lifecycleDesc}</p>
          </div>

          <div className="about-steps-grid">
            {t.lifecycleSteps.map((step, idx) => (
              <div className="about-step-card" key={idx}>
                <div className="about-step-top">
                  <span className="about-step-badge">{step.badge}</span>
                  <span className="about-step-time">{step.time}</span>
                </div>
                <h3 className="about-step-name">{step.title}</h3>
                <p className="about-step-detail">{step.desc}</p>
                <div className="about-step-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CORE PILLARS GRID */}
      <section className="about-pillars-section">
        <div className="about-tech-container">
          <div className="about-section-intro">
            <span className="about-badge-pill">{t.pillarsBadge}</span>
            <h2 className="about-section-heading">{t.pillarsHeading}</h2>
            <p className="about-section-desc">{t.pillarsDesc}</p>
          </div>

          <div className="about-pillars-grid">
            {t.pillars.map((pillar, i) => (
              <div className="about-pillar-box" key={i}>
                <div className="about-pillar-icon">{pillarIcons[i]}</div>
                <h3 className="about-pillar-title">{pillar.title}</h3>
                <p className="about-pillar-desc">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ADVANCED BLUE CTA BANNER */}
      <section className="about-cta-section">
        <div className="about-tech-container">
          <div className="about-cta-card">
            <div className="about-cta-mesh" />
            <div className="about-cta-content">
              <span className="about-cta-pill">{t.ctaPill}</span>
              <h2 className="about-cta-headline">
                {t.ctaHeadlinePrefix}<em>{t.ctaHeadlineHighlight}</em>{t.ctaHeadlineSuffix}
              </h2>
              <p className="about-cta-sub">{t.ctaSub}</p>
              <div className="about-cta-btns">
                <Link href="/products" className="about-cta-btn-main">
                  <span>{t.ctaBtnMain}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/contactUs" className="about-cta-btn-alt">
                  <span>{t.ctaBtnAlt}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
