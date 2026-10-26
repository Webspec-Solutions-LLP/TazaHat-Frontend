"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import "./Login.css";

interface LoginModalProps { onClose: () => void; }

export default function Login({ onClose }: LoginModalProps) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [otpRequested, setOtpRequested] = useState(false);
  const [notice, setNotice] = useState("");
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
    setOtp(current => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < otpRefs.current.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const sendOtp = () => {
    if (!validMobile) {
      setNotice("Enter a valid 10-digit mobile number.");
      return;
    }
    setOtpRequested(true);
    setOtp(["", "", "", "", ""]);
    setNotice("OTP delivery is not connected yet. Add an SMS service to receive a real code.");
  };

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  return (
    <div className="login-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="login-modal-dialog" role="dialog" aria-modal="true" aria-label="Login to TazaHaat">
        <button className="login-modal-close" type="button" onClick={onClose} aria-label="Close login">×</button>
    <main className="login-page is-login-modal">
      <div className="login-top-note" aria-label="Secure login">
        <span className="login-top-wave" aria-hidden="true">〜</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 20 5v6c0 5.2-3.5 8.7-8 11-4.5-2.3-8-5.8-8-11V5l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>
        <span>Secure Login</span>
      </div>

      <section className="login-brand-panel" aria-label="TazaHat fresh groceries">
        <Link className="login-brand" href="/" aria-label="TazaHat home">
          <span className="login-brand-logo"><Image src="/images/logo.png" alt="" width={100} height={100} priority /></span>
          <span className="login-brand-copy"><strong>Taza<span>Hat</span></strong><small>Freshness Delivered</small></span>
        </Link>
        <div className="login-brand-message">
          <p>Fresh Catch</p>
          <p>Better Tomorrow</p>
          <span className="login-brand-underline" />
        </div>
      </section>

      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-greeting"><span>Hello!</span><i aria-hidden="true">✳</i></div>
        <h1 id="login-heading">Welcome Back</h1>
        <p className="login-subtitle">Login with your mobile number to continue</p>

        <form className="login-form" onSubmit={event => { event.preventDefault(); sendOtp(); }}>
          <label className="login-phone-field">
            <span className="login-country-code"><span className="login-flag" aria-hidden="true">🇮🇳</span><b>+91</b><svg className="login-country-chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg></span>
            <span className="login-field-divider" />
            <input aria-label="10-digit mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={12} placeholder="xxx xxx xxxx" value={formattedMobile} onChange={event => { setMobile(event.target.value.replace(/\D/g, "").slice(0, 10)); setOtpRequested(false); setOtp(["", "", "", "", ""]); setNotice(""); }} />
          </label>
          <button className="login-send-otp" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>Send OTP</button>
        </form>
        {notice && <p className={`login-notice${!validMobile ? " is-error" : ""}`} role="status">{notice}</p>}

        {otpRequested && <div className="login-otp-step">
          <div className="login-otp-heading"><h2>Enter 5-Digit OTP</h2><p>Enter the code sent to +91 {mobile}</p></div>
          <div className="login-otp-inputs" role="group" aria-label="Enter 5-digit OTP">
            {otp.map((digit, index) => <input key={index} ref={element => { otpRefs.current[index] = element; }} aria-label={`OTP digit ${index + 1}`} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={digit} placeholder="—" onChange={event => updateOtp(index, event.target.value)} onKeyDown={event => handleOtpKeyDown(index, event)} onPaste={event => { const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5).split(""); if (digits.length) { event.preventDefault(); setOtp(current => current.map((_, digitIndex) => digits[digitIndex] ?? "")); otpRefs.current[Math.min(digits.length, 4)]?.focus(); } }} />)}
          </div>
          <button className="login-verify-button" type="button" disabled={!validMobile || !validOtp} onClick={() => setNotice("OTP verification is not connected yet. Add an authentication service to continue.")}><span>✓</span>Verify &amp; Continue</button>
          <div className="login-otp-actions"><button type="button" onClick={sendOtp}>⟳ <span>Resend OTP</span> in <b>00:30</b></button><button type="button" onClick={() => { setMobile(""); setOtp(["", "", "", "", ""]); setOtpRequested(false); setNotice(""); }}>Change Mobile Number</button></div>
        </div>}
        <div className="login-safe-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg><span>Your information is safe with us</span><i aria-hidden="true">〜</i></div>
      </section>
    </main>
      </div>
    </div>
  );
}
