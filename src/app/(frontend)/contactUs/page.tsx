"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "@/components/navbar/Navbar";
import "./Contact.css";
import Faq from "@/components/faq/Faq";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

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
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");
  const [selectedIssue, setSelectedIssue] = useState("order");
  const [selectedFile, setSelectedFile] = useState("");

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

  const contactCards = [
    {
      ...t.contactCards[0],
      icon: "chat",
      href: "https://wa.me/918794269987",
      tone: "green",
    },
    {
      ...t.contactCards[1],
      icon: "phone",
      href: "tel:+918794269987",
      tone: "blue",
    },
    {
      ...t.contactCards[2],
      icon: "handshake",
      href: "mailto:partner@tazahaat.in",
      tone: "orange",
    },
    {
      ...t.contactCards[3],
      icon: "building",
      href: "https://maps.google.com/?q=Agartala+Tripura",
      tone: "indigo",
    },
  ];

  const issueCategories = [
    { id: "order", label: t.issueCategories[0].label, icon: "truck" },
    { id: "freshness", label: t.issueCategories[1].label, icon: "fresh" },
    { id: "refund", label: t.issueCategories[2].label, icon: "refund" },
    { id: "partner", label: t.issueCategories[3].label, icon: "store" },
  ];

  return (
    <main className="contact-page" lang={t.language}>
      <section className="contact-hero" aria-labelledby="contact-heading">
        <div className="contact-hero-inner">
          <div className="contact-hero-copy">
            <span className="contact-live-label"><i /> {t.liveSupportCommand}</span>
            <h1 id="contact-heading">{t.heroHeading}</h1>
            <p>{t.heroDescription}</p>
          </div>
          <div className="contact-promises" aria-label="Support guarantees">
            <div className="contact-promise"><span className="contact-promise-icon contact-promise-icon--lightning" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.4 2.5 5.8 13h5l-.7 8.5L18.2 10h-5.1l.3-7.5Z"/></svg></span><span><strong>{t.promiseTimeValue}</strong><small>{t.promiseTimeLabel}</small></span></div>
            <div className="contact-promise"><span className="contact-promise-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2 2 2.8-.3.8 2.7 2.4 1.5-1 2.6 1 2.6-2.4 1.5-.8 2.7-2.8-.3-2 2-2-2-2.8.3-.8-2.7L4 14.1l1-2.6-1-2.6 2.4-1.5.8-2.7L10 5l2-2Z"/><path d="m9 12 2 2 4-4"/></svg></span><span><strong>{t.promiseFreshValue}</strong><small>{t.promiseFreshLabel}</small></span></div>
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
            <div><span className="contact-section-kicker"><span aria-hidden="true">ϟ</span> {t.expressResolutionDesk}</span><h2>{t.submitDirectTicket}</h2></div>
            <span className="contact-reply-promise"><TicketIcon name="shield" /> {t.guaranteedReply}</span>
          </div>
          <div className="contact-form-rule" />

          <fieldset className="contact-issue-fieldset">
            <legend>{t.selectIssueCategory} <i>*</i></legend>
            <div className="contact-issue-options">
              {issueCategories.map((issue) => <button type="button" key={issue.id} className={`contact-issue-option${selectedIssue === issue.id ? " is-active" : ""}`} onClick={() => setSelectedIssue(issue.id)}><TicketIcon name={issue.icon} /><span>{issue.label}</span></button>)}
            </div>
          </fieldset>

          <div className="contact-form-grid">
            <label className="contact-field"><span>{t.fullNameLabel} <i>*</i></span><span className="contact-input-wrap"><FieldIcon name="user" /><input required name="name" placeholder={t.fullNamePlaceholder} autoComplete="name" /></span></label>
            <label className="contact-field"><span>{t.phoneLabel} <i>*</i></span><span className="contact-input-wrap"><FieldIcon name="phone" /><input required name="phone" type="tel" placeholder={t.phonePlaceholder} autoComplete="tel" /></span></label>
            <label className="contact-field"><span>{t.emailLabel} <i>*</i></span><span className="contact-input-wrap"><FieldIcon name="mail" /><input required name="email" type="email" placeholder={t.emailPlaceholder} autoComplete="email" /></span></label>
            <label className="contact-field"><span>{t.orderIdLabel} <small>{t.orderIdTag}</small></span><span className="contact-input-wrap"><FieldIcon name="order" /><input name="orderId" placeholder={t.orderIdPlaceholder} /></span></label>
          </div>

          <label className="contact-field contact-message-field"><span>{t.messageLabel} <i>*</i></span><textarea required name="message" placeholder={t.messagePlaceholder} /></label>

          <label className="contact-upload-field"><span className="contact-upload-icon"><TicketIcon name="camera" /></span><span className="contact-upload-copy"><strong>{t.attachPhoto} <small>{t.optional}</small></strong><small>{selectedFile || t.fileFormatHint}</small></span><span className="contact-upload-button">{t.chooseFile}<input type="file" name="attachment" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")} /></span></label>

          <div className="contact-form-bottom"><button className="contact-submit-button" type="submit">{t.submitTicket} <svg className="contact-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5"/></svg></button><span className="contact-sla-note"><TicketIcon name="shield" /> {t.coldChainSupport}</span></div>
        </form>

        <aside className="contact-hub-column">
          <section className="contact-hub-panel">
            <div className="contact-hub-heading"><div><span className="contact-section-kicker"><i /> {t.dispatchStatus}</span><h2>{t.deliveryHubMonitor}</h2></div><span className="contact-hub-network" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.5"/><circle cx="19" cy="6" r="1.5"/><circle cx="5" cy="18" r="1.5"/><circle cx="19" cy="18" r="1.5"/><path d="m10 10-4-3m8 3 4-3m-8 7-4 3m8-3 4 3"/></svg></span></div>
            <div className="contact-hub-list">{t.deliveryHubs.map((hub) => <div className="contact-hub-row" key={hub.name}><i /><div><strong>{hub.name}</strong><small>{hub.details}</small></div><span>{hub.eta}</span></div>)}</div>
            <div className="contact-delivery-slots"><div><span>{t.morningHaat}</span><strong>{t.morningHaatTime}</strong></div><div><span>{t.middayExpress}</span><strong>{t.middayExpressTime}</strong></div><div><span>{t.eveningDinner}</span><strong>{t.eveningDinnerTime}</strong></div></div>
            <Link className="contact-whatsapp-escalation" href="https://wa.me/919830042288" target="_blank" rel="noreferrer"><TicketIcon name="chat" /> {t.whatsappEscalation}</Link>
          </section>
          <section className="contact-guarantee-panel"><span className="contact-guarantee-icon"><TicketIcon name="shield" /></span><div><h2>{t.guaranteeTitle}</h2><p>{t.guaranteeDescription}</p></div></section>
        </aside>
      </section>

      <section className="contact-emergency-banner" aria-labelledby="contact-emergency-title">
        <span className="contact-emergency-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/><path d="M12 5v2m-2-1h4M9 20h6"/></svg></span>
        <div className="contact-emergency-copy"><span className="contact-urgent-label"><i /> {t.urgentReroute}</span><h2 id="contact-emergency-title">{t.emergencyTitle}</h2><p>{t.emergencyDescription}</p></div>
        <div className="contact-emergency-actions"><Link className="contact-call-button" href="tel:+919830042288"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5C3 13.6 10.4 21 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-5-2-2 3a15 15 0 0 1-7-7l3-2-2-6Z"/></svg>{t.callHotlineNow}</Link><Link className="contact-dispatch-button" href="https://wa.me/919830042288" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z"/><path d="M8 9h8M8 13h5"/></svg>{t.whatsappDispatch}</Link></div>
      </section>
      <Faq />
    </main>
  );
}
