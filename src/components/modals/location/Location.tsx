"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkLocationAction, listCitiesAction, locateCityAction, selectCityAction } from "@/app/actions";
import type { ApiCity } from "@/lib/api";
import { useCity } from "@/lib/city";
import { loadGoogleMaps } from "@/lib/googleMaps";
import "./Location.css";

interface LocationProps {
  onClose: () => void;
  onLogin: () => void;
}

const INDIA_CENTER = { lat: 22.5726, lng: 88.3639 }; // Kolkata, used until a city or the visitor's position is known
const LOCATION_BLOCKED = "Location access is blocked for this site. To see products near you, allow Location in your browser's site settings (the lock icon next to the address), or drag the pin / pick a city below.";

type Verdict = { serviceable: true; city: ApiCity } | { serviceable: false; message: string };

export default function Location({ onClose, onLogin }: LocationProps) {
  const router = useRouter();
  const { city: savedCity } = useCity();
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [citiesError, setCitiesError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState(savedCity ? `${savedCity.name}` : "");
  const [verdict, setVerdict] = useState<Verdict | null>(savedCity ? { serviceable: true, city: savedCity } : null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const radiusRef = useRef<google.maps.Circle | null>(null);
  const autoAsked = useRef(false);
  const requestRef = useRef(0);
  const savedCityRef = useRef(savedCity);

  useEffect(() => {
    let cancelled = false;
    void listCitiesAction().then((res) => {
      if (cancelled) return;
      if (res.cities) setCities(res.cities);
      else setCitiesError(res.error ?? "We could not load the delivery cities.");
    });
    return () => { cancelled = true; };
  }, []);

  const moveTo = useCallback((position: google.maps.LatLngLiteral, zoom?: number) => {
    markerRef.current?.setPosition(position);
    radiusRef.current?.setCenter(position);
    mapRef.current?.panTo(position);
    if (zoom) mapRef.current?.setZoom(zoom);
  }, []);

  // A spot on the map (pin dropped, place searched, "use my location") -> address, pincode -> which city delivers there.
  // The lookup runs on the server (server action), nothing about it appears in the browser's network tab.
  const pick = useCallback(async (position: google.maps.LatLngLiteral) => {
    const request = ++requestRef.current;
    setBusy(true);
    setVerdict(null);
    const res = await checkLocationAction(position.lat, position.lng).catch(() => null);
    if (request !== requestRef.current) return;
    if (!res || !res.ok) setVerdict({ serviceable: false, message: res?.error ?? "We could not check this location. Please try again or pick a city below." });
    else {
      setAddress(res.address);
      setVerdict(res.serviceable ? { serviceable: true, city: res.city } : { serviceable: false, message: res.message });
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapElementRef.current) return;
        const map = new g.maps.Map(mapElementRef.current, {
          center: INDIA_CENTER, zoom: 11, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy", clickableIcons: false,
        });
        const marker = new g.maps.Marker({ map, position: INDIA_CENTER, draggable: true, title: "Drag to choose your delivery location" });
        const radius = new g.maps.Circle({ map, center: INDIA_CENTER, radius: 20000, strokeColor: "#0878ff", strokeWeight: 3, fillColor: "#0878ff", fillOpacity: 0.12, clickable: false });
        marker.addListener("drag", () => { const p = marker.getPosition(); if (p) radius.setCenter(p); });
        marker.addListener("dragend", () => { const p = marker.getPosition(); if (p) void pick(p.toJSON()); });
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          const p = event.latLng.toJSON();
          marker.setPosition(p);
          radius.setCenter(p);
          void pick(p);
        });
        mapRef.current = map;
        markerRef.current = marker;
        radiusRef.current = radius;
        setMapsReady(true);
        // start on the city chosen before
        const saved = savedCityRef.current;
        if (saved) {
          void locateCityAction(saved.name).then((spot) => {
            if (spot && !cancelled) { marker.setPosition(spot); radius.setCenter(spot); map.setCenter(spot); }
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setMapError(error instanceof Error ? error.message : "The map could not be loaded.");
      });
    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      radiusRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
      radiusRef.current = null;
    };
  }, [pick]);

  // Google place search on the map's search box
  useEffect(() => {
    if (!mapsReady || !isSearchOpen || !searchInputRef.current || !window.google?.maps?.places) return;
    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, { componentRestrictions: { country: "in" }, fields: ["geometry", "formatted_address"] });
    const listener = autocomplete.addListener("place_changed", () => {
      const spot = autocomplete.getPlace().geometry?.location?.toJSON();
      if (!spot) return;
      moveTo(spot, 15);
      void pick(spot);
    });
    return () => google.maps.event.removeListener(listener);
  }, [mapsReady, isSearchOpen, moveTo, pick]);

  const closeWithAnimation = useCallback((afterClose: () => void = onClose) => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(afterClose, 380);
  }, [isClosing, onClose]);

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
  }, [closeWithAnimation]);

  const chooseCity = async (city: ApiCity) => {
    requestRef.current++;
    setBusy(false);
    setVerdict({ serviceable: true, city });
    setAddress(city.name);
    const spot = await locateCityAction(city.name);
    if (spot) moveTo(spot, 11);
  };

  // Ask the browser for the visitor's position. Browsers show their own "Allow location?" prompt; when it was blocked before
  // we explain how to switch it on again.
  const detectLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) return setVerdict({ serviceable: false, message: "Your browser cannot share its location. Please drag the pin or pick a city." });
    try {
      const status = await navigator.permissions?.query({ name: "geolocation" });
      if (status?.state === "denied") return setVerdict({ serviceable: false, message: LOCATION_BLOCKED });
    } catch {
      // Permissions API missing (older Safari / Firefox): the prompt below still works.
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const spot = { lat: coords.latitude, lng: coords.longitude };
        moveTo(spot, 15);
        void pick(spot);
      },
      (error) => {
        setBusy(false);
        setVerdict({ serviceable: false, message: error.code === error.PERMISSION_DENIED ? LOCATION_BLOCKED : "We could not get your location. Please drag the pin or pick a city." });
      },
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: true },
    );
  }, [moveTo, pick]);

  // First visit (no delivery city yet): ask for location permission as soon as the map is ready.
  useEffect(() => {
    if (!mapsReady || savedCity || autoAsked.current) return;
    autoAsked.current = true;
    void detectLocation();
  }, [mapsReady, savedCity, detectLocation]);

  const confirm = async () => {
    if (!verdict?.serviceable || saving) return;
    setSaving(true);
    const res = await selectCityAction(verdict.city).catch(() => ({ ok: false }));
    if (!res.ok) {
      setSaving(false);
      return setVerdict({ serviceable: false, message: "We could not save this city. Please try again." });
    }
    router.refresh();
    closeWithAnimation();
  };

  const selectedCityId = verdict?.serviceable ? verdict.city.id : "";

  return (
    <div className={`location-backdrop${isClosing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeWithAnimation(); }}>
      <section className="location-modal" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <div className="location-modal-brand">
          <span className="location-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </span>
          <div className="location-brand-copy"><span className="location-brand-name">Taza<span>Haat</span></span><span className="location-brand-tagline">Freshness Delivered</span></div>
          <button type="button" className="location-login-link" onClick={() => closeWithAnimation(onLogin)}>Login</button>
          <button type="button" className="location-close" onClick={() => closeWithAnimation()} aria-label="Close location selector">×</button>
        </div>

        <div className="location-content">
          <div className="location-copy">
            <span className="location-eyebrow">YOUR DELIVERY ADDRESS</span>
            <h2 id="location-title">Fresh picks, <span>closer to home.</span></h2>
            <p>Drag the pin to your address, or pick your city. We show products available at your nearby store.</p>
          </div>

          <section className="location-map-section" aria-label="Delivery map">
            <div className="location-map">
              <div ref={mapElementRef} className="location-map-canvas" role="application" aria-label="Interactive delivery map. Drag the pin to choose a location." />
              {mapError && <p className="location-map-error">{mapError} You can still pick a city below.</p>}
              <div className={`location-map-search${isSearchOpen ? " is-open" : ""}`}>
                {isSearchOpen && (
                  <label className="location-map-search-field">
                    <input ref={searchInputRef} placeholder="Search area, street or landmark" aria-label="Search area, street or landmark" autoFocus />
                  </label>
                )}
                <button type="button" className="location-map-search-toggle" onClick={() => setIsSearchOpen((isOpen) => !isOpen)} aria-label={isSearchOpen ? "Close search" : "Search a place"} aria-expanded={isSearchOpen}>
                  {isSearchOpen ? <span aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>}
                </button>
              </div>
              <button type="button" className="location-map-locate" onClick={() => void detectLocation()} disabled={busy}>Use my current location</button>
              <span className="location-map-caption">{busy ? "Checking this location…" : verdict?.serviceable ? `Delivery area · ${verdict.city.name}` : "Drag the pin to your address"}</span>
            </div>
          </section>

          <div className={`location-current${verdict && !verdict.serviceable ? " is-unavailable" : ""}`}>
            <span className="location-current-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
            <span><small>{verdict?.serviceable ? "We deliver here" : "Selected location"}</small><strong>{address || "No location selected yet"}</strong></span>
            {verdict?.serviceable && <span className="location-current-check" aria-label="Delivery available">✓</span>}
          </div>
          {verdict && !verdict.serviceable && <p className="location-unavailable" role="alert">{verdict.message}</p>}

          <div className="location-popular-heading"><span>Our delivery cities</span><span className="location-heading-rule" /></div>
          <div className="location-chips">
            {citiesError && <p className="location-no-results">{citiesError}</p>}
            {!citiesError && cities.length === 0 && <p className="location-no-results">Loading cities…</p>}
            {cities.map((city, index) => (
              <button type="button" key={city.id} className={`location-chip${selectedCityId === city.id ? " is-selected" : ""}`} style={{ "--chip-index": index } as React.CSSProperties} onClick={() => void chooseCity(city)}>{city.name}</button>
            ))}
          </div>

          <button type="button" className="location-confirm" onClick={() => void confirm()} disabled={!verdict?.serviceable || busy || saving}>
            {verdict?.serviceable ? `Deliver to ${verdict.city.name}` : "Choose a delivery location"}
          </button>
        </div>
        <div className="location-modal-footer"><span>Delivering freshness across India</span><span className="location-footer-dot" /> TazaHat</div>
      </section>
    </div>
  );
}
