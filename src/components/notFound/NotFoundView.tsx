"use client";

import { useEffect, useState } from "react";
import "./NotFound.css";

const SECONDS = 10;

/**
 * The 404 page: a friendly message, buttons to the home page / the products / back, and an automatic return to the home page after a few
 * seconds that the visitor can stop ("Stay on this page"). Plain links + window.location so it also works outside the site layout.
 */
export default function NotFoundView({ name }: { name?: string }) {
  const [left, setLeft] = useState(SECONDS);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    if (left <= 0) { window.location.replace("/"); return; }
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [auto, left]);

  return (
    <main className="nf-page">
      <div className="nf-card">
        <div className="nf-art" aria-hidden="true">
          <span className="nf-four">4</span>
          <svg className="nf-fish" viewBox="0 0 120 80" role="img">
            <defs>
              <linearGradient id="nf-fish-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#11b76b" /><stop offset="1" stopColor="#0875d1" /></linearGradient>
            </defs>
            <path d="M10 40 C28 12 70 8 92 40 C70 72 28 68 10 40 Z" fill="url(#nf-fish-g)" />
            <path d="M92 40 L116 18 L108 40 L116 62 Z" fill="#0a3f76" />
            <circle cx="34" cy="34" r="5" fill="#fff" /><circle cx="35.5" cy="34" r="2.2" fill="#0a3f76" />
            <path d="M52 24 C56 40 56 40 52 56" stroke="#ffffff66" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span className="nf-four">4</span>
        </div>

        <h1 className="nf-title">Oops, this page swam away</h1>
        <p className="nf-text">
          We could not find the page you were looking for. It may have been moved or the link may be wrong{name ? `, but everything fresh at ${name} is still waiting for you` : ""}.
        </p>

        <div className="nf-actions">
          <a className="nf-btn nf-btn-primary" href="/">Go to the home page</a>
          <a className="nf-btn nf-btn-light" href="/products">Browse products</a>
          <button type="button" className="nf-btn nf-btn-ghost" onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign("/"))}>Go back</button>
        </div>

        <p className="nf-auto" role="status" aria-live="polite">
          {auto ? (
            <>
              Taking you to the home page in <b>{left}</b> second{left === 1 ? "" : "s"}.{" "}
              <button type="button" className="nf-link" onClick={() => setAuto(false)}>Stay on this page</button>
            </>
          ) : (
            <>Automatic redirect stopped. <button type="button" className="nf-link" onClick={() => { setLeft(SECONDS); setAuto(true); }}>Redirect me to the home page</button></>
          )}
        </p>
      </div>
    </main>
  );
}
