"use client";

import { BrandWords, useBrand } from "@/lib/brand";
import { useBackClose } from "@/lib/backLayers";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { requestOtpAction, verifyOtpAction } from "@/app/auth-actions";
import type { SessionUser } from "@/lib/server/session";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishTextRaw from "./english.json";
import bengaliTextRaw from "./bengali.json";
import hindiText from "./hindi.json";
import "./Login.css";
import { brandify } from "@/lib/brandText";
const englishText = brandify(englishTextRaw);
const bengaliText = brandify(bengaliTextRaw);

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface LoginModalProps { onClose: () => void; onLoggedIn?: (user: SessionUser) => void; }

const OTP_LENGTH = 4;
const emptyOtp = () => Array<string>(OTP_LENGTH).fill("");

export default function Login({ onClose, onLoggedIn }: LoginModalProps) {
  const [lang] = useLanguage();
  const brand = useBrand();
  // the legal documents linked on the sign-in screen (set in the CRM)
  const [legalLinks, setLegalLinks] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => { void fetch("/api/legal").then((r) => (r.ok ? r.json() : null)).then((d: { documents?: { slug: string; title: string }[] } | null) => setLegalLinks(d?.documents ?? [])).catch(() => undefined); }, []);
  const text = textMap[lang] || englishText;

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [otpRequested, setOtpRequested] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const validMobile = /^\d{10}$/.test(mobile);
  const validOtp = otp.every(digit => /^\d$/.test(digit));
  const formattedMobile = mobile.length > 6
    ? `${mobile.slice(0, 3)} ${mobile.slice(3, 6)} ${mobile.slice(6)}`
    : mobile.length > 3
      ? `${mobile.slice(0, 3)} ${mobile.slice(3)}`
      : mobile;

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.map((item, itemIndex) => itemIndex === index ? digit : item);
    setOtp(next);
    if (digit && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
    // the 4th digit is the last step: no need to press Verify
    if (next.every(item => /^\d$/.test(item))) void verifyOtp(next.join(""));
  };

  const handleOtpKeyDown = (index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
  };

  // the "Resend OTP in 00:30" countdown
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait(seconds => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const sendOtp = async (number = mobile) => {
    if (!/^\d{10}$/.test(number)) {
      setNotice(text.invalidMobileNotice);
      return;
    }
    if (busy) return;
    setBusy(true);
    setNotice("");
    const res = await requestOtpAction(number);
    setBusy(false);
    if (!res.ok) { setNotice(res.error); return; }
    setOtpRequested(true);
    setOtp(emptyOtp());
    setWait(res.resendAfter);
    // without an SMS service the server hands the code back (the fixed test code) so the flow can be used
    setNotice(res.devCode ? `${text.noSmsNotice} ${res.devCode}` : "");
    window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const verifyOtp = async (code = otp.join("")) => {
    if (!validMobile || !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code) || busy) return;
    setBusy(true);
    setNotice("");
    const res = await verifyOtpAction(mobile, code);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.error);
      setOtp(emptyOtp());
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
      return;
    }
    onLoggedIn?.(res.user);
    if (!onLoggedIn) onClose();
  };

  const closeWithAnimation = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const closeDuration = reducedMotion ? 0 : window.matchMedia("(max-width: 575px)").matches ? 560 : 440;
    window.setTimeout(onClose, closeDuration);
  }, [isClosing, onClose]);
  useBackClose(() => closeWithAnimation());

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") closeWithAnimation(); };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [closeWithAnimation]);

  return (
    <div className={`login-modal-backdrop${isClosing ? " is-closing" : ""}`} onMouseDown={event => { if (event.target === event.currentTarget) closeWithAnimation(); }}>
      <div className="login-modal-dialog" role="dialog" aria-modal="true" aria-label={text.modalAria}>
        <button className="login-modal-close" type="button" onClick={closeWithAnimation} aria-label={text.closeAria}>×</button>
        <main className="login-page is-login-modal">
          <section className="login-brand-panel" aria-label={text.brandPanelAria}>
            <Link className="login-brand" href="/" aria-label={text.brandHomeAria}>
              <span className="login-brand-logo"><Image src={brand.logo || "/images/logo.webp"} alt="" width={100} height={100} priority unoptimized={!(brand.logo || "/images/logo.webp").startsWith("/images/")} /></span>
              <span className="login-brand-copy"><strong><BrandWords name={brand.name} /></strong><small>{text.freshnessDelivered}</small></span>
            </Link>
            <div className="login-brand-message">
              <p>{text.freshCatch}</p>
              <p>{text.betterTomorrow}</p>
              <span className="login-brand-underline" />
            </div>
          </section>

          <section className="login-card" aria-labelledby="login-heading">
            <div className="login-greeting"><span>{text.greeting}</span><i aria-hidden="true">✳</i></div>
            <h1 id="login-heading">{text.welcomeHeading}</h1>
            <p className="login-subtitle">{text.loginSubtitle}</p>

            <form className="login-form" onSubmit={event => { event.preventDefault(); void sendOtp(); }}>
              <label className="login-phone-field">
                <span className="login-country-code"><span className="login-flag" aria-hidden="true">🇮🇳</span><b>+91</b><svg className="login-country-chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg></span>
                <span className="login-field-divider" />
                <input aria-label={text.phoneInputAria} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={12} placeholder={text.phonePlaceholder} value={formattedMobile} onChange={event => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobile(digits); setOtpRequested(false); setOtp(emptyOtp()); setNotice("");
                  // the 10th digit sends the OTP by itself
                  if (digits.length === 10) void sendOtp(digits);
                }} />
              </label>
              {!otpRequested && <button className="login-send-otp" type="submit" disabled={busy}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>{text.sendOtp}</button>}
            </form>
            {legalLinks.length > 0 && <p className="login-legal">By continuing you agree to our {legalLinks.map((d, i) => <span key={d.slug}>{i > 0 && (i === legalLinks.length - 1 ? " and " : ", ")}<Link href={`/legal/${d.slug}`} target="_blank" rel="noopener">{d.title}</Link></span>)}.</p>}
            {notice && <p className={`login-notice${notice.startsWith(text.noSmsNotice) || notice.startsWith("No SMS service yet") ? "" : " is-error"}`} role="status">{notice}</p>}

            {otpRequested && <div className="login-otp-step">
              <div className="login-otp-heading"><h2>{text.enterOtpHeading.replace("{length}", String(OTP_LENGTH))}</h2><p>{text.codeSentTo.replace("{mobile}", mobile)}</p></div>
              <div className="login-otp-inputs" role="group" aria-label={text.enterOtpAria.replace("{length}", String(OTP_LENGTH))}>
                {otp.map((digit, index) => <input key={index} ref={element => { otpRefs.current[index] = element; }} aria-label={text.otpDigitAria.replace("{index}", String(index + 1))} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={digit} placeholder="—" onChange={event => updateOtp(index, event.target.value)} onKeyDown={event => handleOtpKeyDown(index, event)} onPaste={event => { const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split(""); if (digits.length) { event.preventDefault(); setOtp(current => current.map((_, digitIndex) => digits[digitIndex] ?? "")); otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus(); if (digits.length === OTP_LENGTH) void verifyOtp(digits.join("")); } }} />)}
              </div>
              <button className="login-verify-button" type="button" disabled={!validMobile || !validOtp || busy} onClick={() => void verifyOtp()}><span>✓</span>{text.verifyContinue}</button>
              <div className="login-otp-actions"><button type="button" disabled={wait > 0 || busy} onClick={() => void sendOtp()}>⟳ <span>{text.resendOtp}</span>{wait > 0 && <> {text.inWord} <b>00:{String(wait).padStart(2, "0")}</b></>}</button><button type="button" onClick={() => { setMobile(""); setOtp(emptyOtp()); setOtpRequested(false); setNotice(""); setWait(0); }}>{text.changeNumber}</button></div>
            </div>}
            <div className="login-safe-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg><span>{text.safeNote}</span><i aria-hidden="true">〜</i></div>
          </section>
        </main>
      </div>
    </div>
  );
}
