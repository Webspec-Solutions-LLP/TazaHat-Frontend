"use client";

import { useEffect, useState } from "react";
import "./Location.css";

interface LocationProps {
  deliveryLocation: string;
  onClose: () => void;
}

const popularLocations = ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Jalpaiguri"];

export default function Location({ deliveryLocation, onClose }: LocationProps) {
  const [query, setQuery] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const closeWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, 380);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWithAnimation();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isClosing, onClose]);

  const selectLocation = (location: string) => {
    setQuery(location);
  };

  return (
    <div className={`location-backdrop${isClosing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeWithAnimation(); }}>
      <section className="location-modal" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <div className="location-modal-brand">
          <span className="location-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </span>
          <div className="location-brand-copy"><span className="location-brand-name">Taza<span>Haat</span></span><span className="location-brand-tagline">Freshness Delivered</span></div>
          <button type="button" className="location-login-link" onClick={onClose}>Login</button>
          <button type="button" className="location-close" onClick={closeWithAnimation} aria-label="Close location selector">×</button>
        </div>

        <div className="location-content">
          <div className="location-copy">
            <span className="location-eyebrow">YOUR DELIVERY ADDRESS</span>
            <h2 id="location-title">Fresh picks, <span>closer to home.</span></h2>
            <p>Choose where you’d like your TazaHaat order delivered.</p>
          </div>

          <label className="location-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city or area" aria-label="Search city or area" autoFocus />
            {query && <button type="button" className="location-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
          </label>

          <div className="location-current">
            <span className="location-current-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
            <span><small>Current delivery location</small><strong>{deliveryLocation}</strong></span>
            <span className="location-current-check" aria-label="Selected">✓</span>
          </div>

          <div className="location-popular-heading"><span>Popular near you</span><span className="location-heading-rule" /></div>
          <div className="location-chips">
            {popularLocations.filter((city) => city.toLowerCase().includes(query.toLowerCase())).map((city, index) => (
              <button type="button" key={city} className={`location-chip${query === city ? " is-selected" : ""}`} style={{ "--chip-index": index } as React.CSSProperties} onClick={() => selectLocation(city)}>{city}</button>
            ))}
            {popularLocations.every((city) => !city.toLowerCase().includes(query.toLowerCase())) && <p className="location-no-results">No matching city yet. Try another search.</p>}
          </div>
        </div>
        <div className="location-modal-footer"><span>Delivering freshness across West Bengal</span><span className="location-footer-dot" /> TazaHaat</div>
      </section>
    </div>
  );
}
