"use client";

import { useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import "./Contact.css";
import Faq from "@/components/faq/Faq";

const contactCards = [
  {
    eyebrow: "WHATSAPP CHATBOT",
    title: "Order Issues & Live Refund",
    description: "Instant photo upload, live fish exchange, or wallet credit in seconds.",
    badge: "Instant Active",
    icon: "chat",
    action: "Chat on WhatsApp",
    href: "https://wa.me/919830042288",
    tone: "green",
  },
  {
    eyebrow: "CALL CENTER HELPLINE",
    title: "1800â€“TAZAâ€“HAAT",
    description: "+91 98300 42288 â€¢ Dedicated Bengali & English support executives.",
    badge: "Toll-Free",
    icon: "phone",
    action: "6:00 AM â€“ 10:00 PM Daily",
    href: "tel:+919830042288",
    tone: "blue",
  },
  {
    eyebrow: "FISHERMEN & GROWERS",
    title: "B2B & Farmer Network",
    description: "partner@tazahaat.in â€¢ Fast 48-hr dock & field inspection.",
    badge: "Vendor Onboarding",
    icon: "handshake",
    action: "Reach Onboard Lead",
    href: "mailto:partner@tazahaat.in",
    tone: "orange",
  },
  {
    eyebrow: "HEADQUARTERS & COLD STORAGE",
    title: "Agartala Distribution Hub",
    description: "Agartala, Tripura 799001 â€¢ Local delivery and cold storage hub.",
    badge: "Central Hub",
    icon: "building",
    action: "Track Hub & Coverage",
    href: "https://maps.google.com/?q=Agartala+Tripura",
    tone: "indigo",
  },
];

const issueCategories = [
  { id: "order", label: "Where is my order?", icon: "truck" },
  { id: "freshness", label: "Freshness / Cut Issue", icon: "fresh" },
  { id: "refund", label: "Refund / Replacement", icon: "refund" },
  { id: "partner", label: "Partner with Us", icon: "store" },
];

const deliveryHubs = [
  { name: "Agartala City", details: "Central Distribution Hub | 22 Riders Active", eta: "Express 30m" },
  { name: "Agartala North", details: "Hub 2 | 18 Riders Active", eta: "Express 35m" },
  { name: "Udaipur", details: "South Tripura Hub | 25 Riders Active", eta: "Express 30m" },
  { name: "Dharmanagar", details: "North Tripura Transit Hub | 14 Riders Active", eta: "Express 40m" },
  { name: "Khowai & Teliamura", details: "West Tripura Route | 16 Riders Active", eta: "Express 35m" },
];

function TicketIcon({ name }: { name: string }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "truck") return <svg {...props}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="17.5" cy="18" r="1.5"/></svg>;
  if (name === "fresh") return <svg {...props}><path d="M12 20c-3.5-3.5-5-6-5-9a5 5 0 0 1 10 0c0 3-1.5 5.5-5 9Z"/><path d="M12 15c0-3 1-5 3-6M8 4c2 0 3.5 1 4 3"/></svg>;
  if (name === "refund") return <span className="contact-rupee-icon" aria-hidden="true">&#8377;</span>;
  if (name === "store") return <svg {...props}><path d="M4 10v10h16V10M3 10l2-6h14l2 6a3 3 0 0 1-5 2 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-5-2Z"/><path d="M9 20v-5h6v5"/></svg>;
  return <svg {...props}><path d="M12 3 4.5 6v5c0 4.8 3.2 8.1 7.5 10 4.3-1.9 7.5-5.2 7.5-10V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

function FieldIcon({ name }: { name: string }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "user") return <svg {...props}><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>;
  if (name === "phone") return <svg {...props}><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M10 18.5h4"/></svg>;
  if (name === "mail") return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
  return <svg {...props}><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7"/></svg>;
}

function submitTicket(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  window.location.href = "https://wa.me/919830042288";
}

function ContactIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "chat") return <svg viewBox="0 0 24 24" {...common}><path d="M4 5.5h16v12H9l-5 3v-15Z"/><path d="M8 10h8M8 14h5"/></svg>;
  if (name === "phone") return <svg viewBox="0 0 24 24" {...common}><path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-5-2-2 3a15.4 15.4 0 0 1-7-7l3-2-2-6Z"/></svg>;
  if (name === "handshake") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.8 8.5 4-3.3 4.4 1.2 2-1 8 3.1-3.3 3.4"/><path d="m6.4 9.2 5.1 5.2a1.8 1.8 0 0 0 2.6-2.5l-1.2-1.2 2 2a1.8 1.8 0 0 0 2.6-2.5l-3.2-3.3"/><path d="m6.6 12 3.8 3.8a1.8 1.8 0 0 0 2.6-2.5m-4.6 1 2.3 2.3a1.8 1.8 0 0 0 2.6-2.5"/><path d="m2.8 8.5 3.5 3.7m15-3.7-3.4 3.5"/></svg>;
  if (name === "building") return <svg viewBox="0 0 24 24" {...common}><path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M17 13h1M17 17h1M2 21h20"/></svg>;
  return <svg viewBox="0 0 24 24" {...common}><path d="m2.8 8.5 4-3.3 4.4 1.2 2-1 8 3.1-3.3 3.4"/><path d="m6.4 9.2 5.1 5.2a1.8 1.8 0 0 0 2.6-2.5l-1.2-1.2 2 2a1.8 1.8 0 0 0 2.6-2.5l-3.2-3.3"/><path d="m6.6 12 3.8 3.8a1.8 1.8 0 0 0 2.6-2.5m-4.6 1 2.3 2.3a1.8 1.8 0 0 0 2.6-2.5"/><path d="m2.8 8.5 3.5 3.7m15-3.7-3.4 3.5"/></svg>;
}

function ActionIcon({ tone }: { tone: string }) {
  if (tone === "green") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5"/></svg>;
  if (tone === "blue") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-5-2-2 3a15 15 0 0 1-7-7l3-2-2-6Z"/></svg>;
  if (tone === "orange") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z"/><path d="m10 9 5 5M15 9l-5 5"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 3-7.5 18-3.7-7.8L2 9.5 21 3Z"/><path d="m9.8 13.2 4.4-4.4"/></svg>;
}

export default function ContactUsPage() {
  const [selectedIssue, setSelectedIssue] = useState("order");
  const [selectedFile, setSelectedFile] = useState("");
  return (
    <main className="contact-page">
      <section className="contact-hero" aria-labelledby="contact-heading">
        <div className="contact-hero-inner">
          <div className="contact-hero-copy">
            <span className="contact-live-label"><i /> TRIPURA 24/7 LIVE SUPPORT COMMAND</span>
            <h1 id="contact-heading">Customer Care & Rapid Resolution Desk</h1>
            <p>Need help with early morning catch cuts, farm harvest quality, delivery rerouting, or vendor partnerships? We guarantee live Tripura-based resolution within 15 minutes.</p>
          </div>
          <div className="contact-promises" aria-label="Support guarantees">
            <div className="contact-promise"><span className="contact-promise-icon contact-promise-icon--lightning" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.4 2.5 5.8 13h5l-.7 8.5L18.2 10h-5.1l.3-7.5Z"/></svg></span><span><strong>&lt; 15 Mins</strong><small>Avg. WhatsApp Response</small></span></div>
            <div className="contact-promise"><span className="contact-promise-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2 2 2.8-.3.8 2.7 2.4 1.5-1 2.6 1 2.6-2.4 1.5-.8 2.7-2.8-.3-2 2-2-2-2.8.3-.8-2.7L4 14.1l1-2.6-1-2.6 2.4-1.5.8-2.7L10 5l2-2Z"/><path d="m9 12 2 2 4-4"/></svg></span><span><strong>100% Replacement</strong><small>Instant Freshness Guarantee</small></span></div>
          </div>
        </div>
      </section>

      <section className="contact-cards" aria-label="Contact options">
        {contactCards.map((card) => (
          <article className={`contact-card contact-card--${card.tone}`} key={card.eyebrow}>
            <div className="contact-card-top"><span className="contact-card-icon"><ContactIcon name={card.icon} /></span><span className="contact-card-badge">{card.badge === "Instant Active" && <i />}{card.badge}</span></div>
            <p className="contact-card-eyebrow">{card.eyebrow}</p>
            <h2>{card.title}</h2>
            <p className="contact-card-description">{card.description}</p>
            <Link className="contact-card-action" href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel={card.href.startsWith("http") ? "noreferrer" : undefined}>
              <span>{card.action}</span><ActionIcon tone={card.tone} />
            </Link>
          </article>
        ))}
      </section>

      <section className="contact-support-layout" aria-label="Support ticket and delivery hub status">
        <form className="contact-ticket-panel" onSubmit={submitTicket}>
          <div className="contact-panel-heading">
            <div><span className="contact-section-kicker"><span aria-hidden="true">ϟ</span> EXPRESS RESOLUTION DESK</span><h2>Submit Direct Ticket</h2></div>
            <span className="contact-reply-promise"><TicketIcon name="shield" /> Guaranteed reply &lt; 15 mins</span>
          </div>
          <div className="contact-form-rule" />

          <fieldset className="contact-issue-fieldset">
            <legend>Select Issue Category <i>*</i></legend>
            <div className="contact-issue-options">
              {issueCategories.map((issue) => <button type="button" key={issue.id} className={`contact-issue-option${selectedIssue === issue.id ? " is-active" : ""}`} onClick={() => setSelectedIssue(issue.id)}><TicketIcon name={issue.icon} /><span>{issue.label}</span></button>)}
            </div>
          </fieldset>

          <div className="contact-form-grid">
            <label className="contact-field"><span>Full Name <i>*</i></span><span className="contact-input-wrap"><FieldIcon name="user" /><input required name="name" placeholder="Your full name" autoComplete="name" /></span></label>
            <label className="contact-field"><span>Phone / WhatsApp Number <i>*</i></span><span className="contact-input-wrap"><FieldIcon name="phone" /><input required name="phone" type="tel" placeholder="+91 9XXXXXXXXX" autoComplete="tel" /></span></label>
            <label className="contact-field"><span>Email Address <i>*</i></span><span className="contact-input-wrap"><FieldIcon name="mail" /><input required name="email" type="email" placeholder="name@domain.com" autoComplete="email" /></span></label>
            <label className="contact-field"><span>Order ID <small>Fast-track lookup</small></span><span className="contact-input-wrap"><FieldIcon name="order" /><input name="orderId" placeholder="e.g. TH-2026-98214" /></span></label>
          </div>

          <label className="contact-field contact-message-field"><span>Describe Your Concern <i>*</i></span><textarea required name="message" placeholder="Please describe what happened (e.g., delayed delivery, freshness concern, missing item, or partnership enquiry)â€¦" /></label>

          <label className="contact-upload-field"><span className="contact-upload-icon"><TicketIcon name="camera" /></span><span className="contact-upload-copy"><strong>Attach a photo or bill <small>(optional)</small></strong><small>{selectedFile || "JPG, PNG or PDF, up to 10 MB"}</small></span><span className="contact-upload-button">Choose file<input type="file" name="attachment" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")} /></span></label>

          <div className="contact-form-bottom"><button className="contact-submit-button" type="submit">Submit Ticket <svg className="contact-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5"/></svg></button><span className="contact-sla-note"><TicketIcon name="shield" /> Tripura cold-chain support</span></div>
        </form>

        <aside className="contact-hub-column">
          <section className="contact-hub-panel">
            <div className="contact-hub-heading"><div><span className="contact-section-kicker"><i /> TRIPURA REAL-TIME DISPATCH STATUS</span><h2>Delivery Hub Monitor</h2></div><span className="contact-hub-network" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.5"/><circle cx="19" cy="6" r="1.5"/><circle cx="5" cy="18" r="1.5"/><circle cx="19" cy="18" r="1.5"/><path d="m10 10-4-3m8 3 4-3m-8 7-4 3m8-3 4 3"/></svg></span></div>
            <div className="contact-hub-list">{deliveryHubs.map((hub) => <div className="contact-hub-row" key={hub.name}><i /><div><strong>{hub.name}</strong><small>{hub.details}</small></div><span>{hub.eta}</span></div>)}</div>
            <div className="contact-delivery-slots"><div><span>MORNING HAAT</span><strong>6:00 - 10:00 AM</strong></div><div><span>MIDDAY EXPRESS</span><strong>12:00 - 3:00 PM</strong></div><div><span>EVENING DINNER</span><strong>4:30 - 9:00 PM</strong></div></div>
            <Link className="contact-whatsapp-escalation" href="https://wa.me/919830042288" target="_blank" rel="noreferrer"><TicketIcon name="chat" /> Instant WhatsApp Escalation</Link>
          </section>
          <section className="contact-guarantee-panel"><span className="contact-guarantee-icon"><TicketIcon name="shield" /></span><div><h2>Zero-Hassle Freshness Guarantee</h2><p>If your fresh order does not meet expectations, report it to our support team. Weâ€™ll review your concern and help with the next steps.</p></div></section>
        </aside>
      </section>

      <section className="contact-emergency-banner" aria-labelledby="contact-emergency-title">
        <span className="contact-emergency-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/><path d="M12 5v2m-2-1h4M9 20h6"/></svg></span>
        <div className="contact-emergency-copy"><span className="contact-urgent-label"><i /> URGENT ORDER REROUTE</span><h2 id="contact-emergency-title">Cold-Chain Emergency Dispatcher Hotline</h2><p>Is your delivery vehicle delayed, or do you need gate access coordination? Speak right now to the on-duty hub manager.</p></div>
        <div className="contact-emergency-actions"><Link className="contact-call-button" href="tel:+919830042288"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-5-2-2 3a15 15 0 0 1-7-7l3-2-2-6Z"/></svg>Call Hotline Now</Link><Link className="contact-dispatch-button" href="https://wa.me/919830042288" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z"/><path d="M8 9h8M8 13h5"/></svg>WhatsApp Dispatch</Link></div>
      </section>
      <Faq />
    </main>
  );
}
