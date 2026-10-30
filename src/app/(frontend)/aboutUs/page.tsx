"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./About.css";

const tabContent = [
  {
    id: "mission",
    label: "Origin & Mission",
    badge: "HYPERLOCAL IMPACT",
    title: "Bridging Tripura's Traditional Bazaars with Next-Gen Tech",
    lead: "TazaHaat was founded with an uncompromising mission: to rescue fresh food commerce in Northeast India from lengthy, opaque supply chains and chemical adulteration.",
    points: [
      {
        title: "Direct Sourcing Infrastructure",
        desc: "We buy directly at dawn from verified cultivators and river dock fishermen across Tripura, bypassing 3 to 5 exploitative intermediaries.",
      },
      {
        title: "Fair Value for Producers",
        desc: "Local farmers and fishermen earn 25-30% more compared to traditional mandi rates, backed by same-day digital settlements.",
      },
      {
        title: "Radical Consumer Transparency",
        desc: "Every vegetable bunch and fish order is traceable back to its source pond or cluster, offering complete peace of mind for families.",
      },
    ],
    metricValue: "45K+",
    metricLabel: "Tripura Households Served",
    highlightTag: "100% Direct Sourced",
  },
  {
    id: "coldchain",
    label: "Smart Cold Chain",
    badge: "IOT & PRECISION CHILL",
    title: "0°C to 4°C Unbroken Cold Chain from Dock to Door",
    lead: "Freshwater fish and delicate organic produce lose nutritional value rapidly under humid tropical heat. Our micro-hubs deploy active thermal monitoring.",
    points: [
      {
        title: "IoT Sensor Monitoring",
        desc: "Real-time telemetry continuously logs storage temperatures inside our central Agartala hub and refrigerated fleet.",
      },
      {
        title: "Formalin & Chemical Free Guarantee",
        desc: "Zero chemical preservatives, zero ammonia sprays, and zero artificial coloring. Only clean food-grade flake ice and ozone purification.",
      },
      {
        title: "Thermal-Shielded Delivery Packs",
        desc: "Insulated, food-grade transit packaging guarantees produce arrives as crisp and fresh as when harvested at daybreak.",
      },
    ],
    metricValue: "< 90m",
    metricLabel: "Hub-to-Doorstep Window",
    highlightTag: "Continuous Temp Logs",
  },
  {
    id: "farmers",
    label: "Farmer Network",
    badge: "COMMUNITY FIRST",
    title: "Empowering 350+ Local Agritech Partners Across Tripura",
    lead: "We do not simply purchase crops; we invest in local agricultural prosperity by offering crop planning, modern organic guidance, and guaranteed off-take contracts.",
    points: [
      {
        title: "Zero Middleman Commission",
        desc: "Growers receive full market value without paying arbitrary mandi brokerages or enduring delayed credit cycles.",
      },
      {
        title: "Demand Forecasting AI",
        desc: "We share predictive harvest demands with our grower co-ops, drastically cutting post-harvest surplus and seasonal food loss.",
      },
      {
        title: "Women & Youth Employment",
        desc: "More than 65% of our sorting, quality inspection, and packaging team is drawn from rural and semi-urban communities in Tripura.",
      },
    ],
    metricValue: "350+",
    metricLabel: "Partner Cultivators & Fishermen",
    highlightTag: "Zero Exploitation",
  },
  {
    id: "quality",
    label: "Quality Protocol",
    badge: "LAB-GRADE VERIFICATION",
    title: "Triple-Point Quality Inspection Before Any Pack Leaves",
    lead: "We hold ourselves to standards that match the world's most rigorous grocery supply networks, adapted specifically for Northeast Indian produce.",
    points: [
      {
        title: "Dawn Sorting & Grading",
        desc: "Trained agrarian quality specialists grade produce based on firmness, natural color, aroma, and natural ripeness.",
      },
      {
        title: "Ozonized Wash & Sanitization",
        desc: "Vegetables and leafy greens undergo multi-stage ozonized water rinsing to eliminate surface dust and organic microbes without chemicals.",
      },
      {
        title: "At-the-Door Open Box Inspection",
        desc: "Customers are encouraged to inspect their fish and vegetables at their doorstep. If you are not delighted, return it instantly.",
      },
    ],
    metricValue: "99.4%",
    metricLabel: "First-Time Freshness Score",
    highlightTag: "Doorstep Open-Box Return",
  },
];

const lifecycleSteps = [
  {
    time: "04:30 AM",
    title: "Dawn Harvest & Dock Catch",
    desc: "Produce is harvested and river fish collected at dawn from local Tripura ponds and farms under chilled holding conditions.",
    badge: "Step 01",
  },
  {
    time: "06:15 AM",
    title: "Ozone Wash & Precision Sorting",
    desc: "Arrives at our central Agartala Cold Hub for inspection, chemical screening, ozonized cleaning, and grade-A sorting.",
    badge: "Step 02",
  },
  {
    time: "07:30 AM",
    title: "Thermal Eco-Shield Packaging",
    desc: "Packaged in food-grade, breathable and insulated containers that maintain core temperature without artificial additives.",
    badge: "Step 03",
  },
  {
    time: "08:45 AM",
    title: "Hyperlocal Doorstep Dispatch",
    desc: "Delivered to your kitchen via smart-routed delivery partners within guaranteed morning and evening fulfillment slots.",
    badge: "Step 04",
  },
];

const corePillars = [
  {
    title: "100% Chemical-Free Freshness",
    desc: "Zero formalin, zero wax coatings, and zero synthetic ripening agents. We test incoming catch so your family eats cleanly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Direct-From-Source Pricing",
    desc: "Cutting out multiple layers of brokerages allows us to offer honest prices for buyers and superior compensation for local growers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 6v12" />
      </svg>
    ),
  },
  {
    title: "Active Cold Chain & IoT Hubs",
    desc: "Our localized Agartala fulfillment hubs preserve micro-nutrients and texture from receipt through last-mile delivery.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      </svg>
    ),
  },
  {
    title: "Open-Box Doorstep Verification",
    desc: "Check every item with our delivery executive. Complete peace of mind with instant wallet credit or cash refund if dissatisfied.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

export default function AboutUsPage() {
  const [activeTab, setActiveTab] = useState("mission");
  const currentTab = tabContent.find((t) => t.id === activeTab) || tabContent[0];

  return (
    <div className="about-tech-page">
      {/* 1. ADVANCED BLUE HERO */}
      <section className="about-tech-hero">
        <div className="about-tech-container">
          <div className="about-hero-layout">
            <div className="about-hero-text">
              <div className="about-hero-badge">
                <span className="about-pulse-dot" />
                <span>PIONEERING HYPERLOCAL AGRITECH IN TRIPURA</span>
              </div>
              <h1 className="about-hero-title">
                Redefining Fresh Food with <em>Smart Logistics</em> &amp; Honest Commerce.
              </h1>
              <p className="about-hero-sub">
                TazaHaat is building Northeast India&apos;s most advanced fresh supply network.
                We eliminate layers of middlemen to deliver morning harvest vegetables, freshwater river catch,
                and dairy directly to your kitchen in under 90 minutes.
              </p>
              <div className="about-hero-actions">
                <Link href="/products" className="about-btn-primary">
                  <span>Explore Fresh Products</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/contactUs" className="about-btn-secondary">
                  <span>Partner With Us</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V8H8" />
                  </svg>
                </Link>
              </div>

              <div className="about-hero-trust-chips">
                <div className="about-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>100% Formalin Free</span>
                </div>
                <div className="about-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Dawn-To-Door Direct</span>
                </div>
                <div className="about-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Doorstep Open-Box Inspection</span>
                </div>
              </div>
            </div>

            <div className="about-hero-media">
              <div className="about-hero-media-wrapper">
                <Image
                  src="/images/banner7.webp"
                  alt="TazaHaat Fresh Produce and Supply Chain"
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
                    <span className="about-hud-label">COLD CHAIN TELEMETRY</span>
                    <strong className="about-hud-val">3.6°C Core Temp Active</strong>
                  </div>
                </div>

                <div className="about-hud-card about-hud-bottom">
                  <div className="about-hud-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h12M6 8h12M6 12h8a4 4 0 0 0 0-8M6 12l9 9" /></svg>
                  </div>
                  <div>
                    <span className="about-hud-label">DIRECT GROWER BENEFIT</span>
                    <strong className="about-hud-val">+28% Higher Farmer Income</strong>
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
            <div className="about-metric-card">
              <div className="about-metric-header">
                <span className="about-metric-num">45K+</span>
                <span className="about-metric-tag">Families</span>
              </div>
              <h3 className="about-metric-label">Households Served</h3>
              <p className="about-metric-sub">Daily fresh orders fulfilled reliably across Agartala and growing districts.</p>
            </div>

            <div className="about-metric-card">
              <div className="about-metric-header">
                <span className="about-metric-num">350+</span>
                <span className="about-metric-tag">Growers</span>
              </div>
              <h3 className="about-metric-label">Partner Farmers &amp; Fishers</h3>
              <p className="about-metric-sub">Direct contract partnerships with fair same-day digital payments.</p>
            </div>

            <div className="about-metric-card">
              <div className="about-metric-header">
                <span className="about-metric-num">&lt; 90m</span>
                <span className="about-metric-tag">Express</span>
              </div>
              <h3 className="about-metric-label">Neighborhood Delivery</h3>
              <p className="about-metric-sub">Dispatched from localized cold nodes to preserve natural vitamins.</p>
            </div>

            <div className="about-metric-card">
              <div className="about-metric-header">
                <span className="about-metric-num">99.4%</span>
                <span className="about-metric-tag">Rating</span>
              </div>
              <h3 className="about-metric-label">Freshness Satisfaction</h3>
              <p className="about-metric-sub">Rigorous triple-point inspection backed by instant doorstep refund.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE TABS: CORE FOUNDATIONS & TECHNOLOGY */}
      <section className="about-tabs-section">
        <div className="about-tech-container">
          <div className="about-section-intro">
            <span className="about-badge-pill">OUR ARCHITECTURE</span>
            <h2 className="about-section-heading">Built to Solve Northeast India&apos;s Perishable Supply Chain</h2>
            <p className="about-section-desc">
              Conventional wholesale mandis rely on multiple middlemen, delayed transit, and hazardous chemical preservatives.
              Here is how TazaHaat changes the equation using modern engineering.
            </p>
          </div>

          <div className="about-tab-nav">
            {tabContent.map((tab) => (
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
                  <li>
                    <span className="about-check-dot" />
                    Real-time digital traceability
                  </li>
                  <li>
                    <span className="about-check-dot" />
                    Zero formaldehyde / formalin certification
                  </li>
                  <li>
                    <span className="about-check-dot" />
                    Agartala Central Cold Hub audited daily
                  </li>
                </ul>
                <Link href="/products" className="about-stat-link">
                  Order from this pipeline <span>→</span>
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
            <span className="about-badge-pill">FIELD TO FORK</span>
            <h2 className="about-section-heading">How TazaHaat Delivers In Hours, Not Days</h2>
            <p className="about-section-desc">
              Every morning, before most of Tripura wakes up, our network is in full motion to bring you food at peak freshness.
            </p>
          </div>

          <div className="about-steps-grid">
            {lifecycleSteps.map((step, idx) => (
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
            <span className="about-badge-pill">UNCOMPROMISING PROMISES</span>
            <h2 className="about-section-heading">The Four Standards That Define TazaHaat</h2>
            <p className="about-section-desc">
              Designed around safety, transparent economics, and customer-first values.
            </p>
          </div>

          <div className="about-pillars-grid">
            {corePillars.map((pillar, i) => (
              <div className="about-pillar-box" key={i}>
                <div className="about-pillar-icon">{pillar.icon}</div>
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
              <span className="about-cta-pill">START FRESH TODAY</span>
              <h2 className="about-cta-headline">
                Ready to Experience <em>Pure Morning Harvest</em> at Your Doorstep?
              </h2>
              <p className="about-cta-sub">
                Explore today&apos;s live freshwater fish selection, crisp organic vegetables, and pantry essentials.
                Order in under 2 minutes.
              </p>
              <div className="about-cta-btns">
                <Link href="/products" className="about-cta-btn-main">
                  <span>Browse Fresh Products</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link href="/contactUs" className="about-cta-btn-alt">
                  <span>Help &amp; Support Hub</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
