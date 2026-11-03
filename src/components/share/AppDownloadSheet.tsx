"use client";

import { useEffect, useState } from "react";
import "./Share.css";

type AppLink = { state: "link"; url: string } | { state: "soon" | "hidden"; url: null };
const KEY = "tazahat_app_sheet_until";
const DAYS = 7;

/**
 * A bottom sheet that asks the visitor to get the app ("a better experience"), with the App Store and Google Play buttons the CRM has set.
 * Shown once in a while (not again for a week once closed), on phones and on the desktop alike; never inside the app itself.
 */
export default function AppDownloadSheet({ android, ios }: { android: AppLink; ios: AppLink }) {
  const [open, setOpen] = useState(false);
  const hasAny = android.state === "link" || ios.state === "link";

  useEffect(() => {
    if (!hasAny) return;
    try { if (Number(window.localStorage.getItem(KEY) ?? 0) > Date.now()) return; } catch { /* no storage: show it */ }
    if (/TazaHatApp/i.test(navigator.userAgent)) return;
    const t = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(t);
  }, [hasAny]);

  const close = () => { setOpen(false); try { window.localStorage.setItem(KEY, String(Date.now() + DAYS * 86_400_000)); } catch { /* ignore */ } };
  if (!open) return null;

  // phones see their own store first
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const stores = [
    { key: "ios", link: ios, name: "App Store", sub: "Download on the", icon: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.7c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.7-.8 3.100-.8 1.500 0 1.900.8 3.200.8 1.300 0 2.100-1.200 2.900-2.300.9-1.300 1.300-2.600 1.300-2.700 0 0-2.500-1-2.600-4zM14 5.600c.7-.8 1.100-1.900 1-3-1 0-2.100.7-2.800 1.500-.6.700-1.200 1.800-1 2.900 1.100.1 2.100-.6 2.800-1.400z" /></svg> },
    { key: "android", link: android, name: "Google Play", sub: "Get it on", icon: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3.200v17.600c0 .4.4.6.700.4l9.700-8.800L4.700 2.800c-.3-.2-.7 0-.7.400zm11.500 7.700L6.300 2.600l9.700 5.500 1.900 1.900-2.400.9zm0 2.200 2.400.9-1.900 1.900-9.700 5.500 9.200-8.300zm4.400-1.600c.5.300.5 1 0 1.300l-2.200 1.200-2.100-1.900 2.100-1.900 2.200 1.300z" /></svg> },
  ].filter((s) => s.link.state === "link").sort((a, b) => (isIos ? (a.key === "ios" ? -1 : 1) : a.key === "android" ? -1 : 1));

  return (
    <div className="share-backdrop" onClick={close}>
      <div className="share-sheet" role="dialog" aria-label="Get the TazaHat app" onClick={(e) => e.stopPropagation()}>
        <div className="share-head">
          <div className="app-sheet-hero"><img src="/images/logo.webp" alt="" /><div><h3>For a better experience, get the TazaHat app</h3><p style={{ margin: 0 }}>Faster ordering, live order tracking and offers made for you.</p></div></div>
          <button type="button" className="share-close" aria-label="Close" onClick={close}>✕</button>
        </div>
        <div className="app-sheet-stores">
          {stores.map((s) => <a key={s.key} className="app-sheet-store" href={(s.link as { url: string }).url} target="_blank" rel="noopener noreferrer" onClick={close}>{s.icon}<span><small>{s.sub}</small>{s.name}</span></a>)}
        </div>
        <button type="button" className="app-sheet-skip" onClick={close}>Continue on the website</button>
      </div>
    </div>
  );
}
