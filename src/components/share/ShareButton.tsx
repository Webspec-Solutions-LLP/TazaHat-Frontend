"use client";

import { useState } from "react";
import "./Share.css";

const SHARE_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>;

/**
 * The share icon of a product page. On a phone it opens the phone's own share menu (WhatsApp, Messages ...); anywhere else a small sheet
 * with the usual apps and "Copy link". What the receiver sees (picture, name, text) comes from the page's link-preview tags.
 */
export default function ShareButton({ title, text, path, label = "Share" }: { title: string; text?: string; path: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;

  const share = async () => {
    const data = { title, text: text ?? title, url: url() };
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
      try { await navigator.share(data); return; } catch (e) { if ((e as DOMException).name === "AbortError") return; }
    }
    setOpen(true);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); } catch { const i = document.getElementById("share-url") as HTMLInputElement | null; i?.select(); document.execCommand("copy"); }
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };
  const enc = (v: string) => encodeURIComponent(v);
  const apps = () => [
    { name: "WhatsApp", color: "#25d366", mark: "W", href: `https://wa.me/?text=${enc(`${title} ${url()}`)}` },
    { name: "Facebook", color: "#1877f2", mark: "f", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url())}` },
    { name: "Telegram", color: "#229ed9", mark: "T", href: `https://t.me/share/url?url=${enc(url())}&text=${enc(title)}` },
    { name: "X", color: "#111", mark: "X", href: `https://twitter.com/intent/tweet?url=${enc(url())}&text=${enc(title)}` },
    { name: "Email", color: "#ea4335", mark: "@", href: `mailto:?subject=${enc(title)}&body=${enc(`${text ?? title}\n${url()}`)}` },
  ];

  return (
    <>
      <button type="button" className="share-icon-btn" aria-label={label} title={label} onClick={() => void share()}>{SHARE_ICON}</button>
      {open && (
        <div className="share-backdrop" onClick={() => setOpen(false)}>
          <div className="share-sheet" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
            <div className="share-head"><div><h3>{label}</h3><p>{title}</p></div><button type="button" className="share-close" aria-label="Close" onClick={() => setOpen(false)}>✕</button></div>
            <div className="share-grid">
              {apps().map((a) => <a key={a.name} className="share-opt" href={a.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><span style={{ background: a.color }}>{a.mark}</span>{a.name}</a>)}
              <button type="button" className="share-opt" onClick={() => void copy()}><span style={{ background: "#0875d1" }}>⧉</span>{copied ? "Copied!" : "Copy link"}</button>
            </div>
            <div className="share-link"><input id="share-url" readOnly value={typeof window === "undefined" ? "" : url()} onFocus={(e) => e.currentTarget.select()} /><button type="button" onClick={() => void copy()}>{copied ? "Copied" : "Copy"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
