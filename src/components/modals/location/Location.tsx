"use client";

import { useBackClose } from "@/lib/backLayers";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkLocationAction, listCitiesAction, locateCityAction, selectCityAction } from "@/app/actions";
import type { ApiCity } from "@/lib/api";
import { useCity } from "@/lib/city";
import { loadGoogleMaps } from "@/lib/googleMaps";
import "./Location.css";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface LocationProps {
  onClose: () => void;
}

const INDIA_CENTER = { lat: 22.5726, lng: 88.3639 }; // Kolkata, used until a city or the visitor's position is known

type Verdict = { serviceable: true; city: ApiCity; pincode?: string } | { serviceable: false; message: string };

export default function Location({ onClose }: LocationProps) {
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;

  const router = useRouter();
  const { city: savedCity } = useCity();
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [citiesError, setCitiesError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState(savedCity ? `${savedCity.name}` : "");
  const [verdict, setVerdict] = useState<Verdict | null>(savedCity ? { serviceable: true, city: savedCity, pincode: savedCity.pincode } : null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autoAsked = useRef(false);
  const requestRef = useRef(0);
  const savedCityRef = useRef(savedCity);

  useEffect(() => {
    let cancelled = false;
    void listCitiesAction().then((res) => {
      if (cancelled) return;
      if (res.cities) setCities(res.cities);
      else setCitiesError(res.error ?? t.citiesLoadError);
    });
    return () => { cancelled = true; };
  }, [t.citiesLoadError]);

  const moveTo = useCallback((position: google.maps.LatLngLiteral, zoom?: number) => {
    markerRef.current?.setPosition(position);
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
    if (!res || !res.ok) setVerdict({ serviceable: false, message: res?.error ?? t.locationCheckError });
    else {
      setAddress(res.address);
      setVerdict(res.serviceable ? { serviceable: true, city: res.city, pincode: res.pincode } : { serviceable: false, message: res.message });
    }
    setBusy(false);
  }, [t.locationCheckError]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapElementRef.current) return;
        const map = new g.maps.Map(mapElementRef.current, {
          center: INDIA_CENTER, zoom: 11, disableDefaultUI: true, zoomControl: true, zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_CENTER }, gestureHandling: "greedy", clickableIcons: false,
        });
        const marker = new g.maps.Marker({ map, position: INDIA_CENTER, draggable: true, title: t.dragMarkerTitle });
        marker.addListener("dragend", () => { const p = marker.getPosition(); if (p) void pick(p.toJSON()); });
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          const p = event.latLng.toJSON();
          marker.setPosition(p);
          void pick(p);
        });
        mapRef.current = map;
        markerRef.current = marker;
        setMapsReady(true);
        // start on the city chosen before
        const saved = savedCityRef.current;
        if (saved) {
          void locateCityAction(saved.name).then((spot) => {
            if (spot && !cancelled) { marker.setPosition(spot); map.setCenter(spot); }
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setMapError(error instanceof Error ? error.message : t.mapLoadError);
      });
    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [pick, t.dragMarkerTitle, t.mapLoadError]);

  // Google place search on the map's search box
  useEffect(() => {
    if (!mapsReady || !searchInputRef.current || !window.google?.maps?.places) return;
    const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, { componentRestrictions: { country: "in" }, fields: ["geometry", "formatted_address"] });
    const listener = autocomplete.addListener("place_changed", () => {
      const spot = autocomplete.getPlace().geometry?.location?.toJSON();
      if (!spot) return;
      moveTo(spot, 15);
      void pick(spot);
    });
    return () => google.maps.event.removeListener(listener);
  }, [mapsReady, moveTo, pick]);

  const closeWithAnimation = useCallback((afterClose: () => void = onClose) => {
    if (isClosing) return;
    setIsClosing(true);
    const closeDuration = window.matchMedia("(max-width: 575px)").matches ? 560 : 380;
    window.setTimeout(afterClose, closeDuration);
  }, [isClosing, onClose]);
  useBackClose(() => closeWithAnimation());

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
    if (!("geolocation" in navigator)) return setVerdict({ serviceable: false, message: t.geoNotSupported });
    try {
      const status = await navigator.permissions?.query({ name: "geolocation" });
      if (status?.state === "denied") return setVerdict({ serviceable: false, message: t.locationBlocked });
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
        setVerdict({ serviceable: false, message: error.code === error.PERMISSION_DENIED ? t.locationBlocked : t.geoFailed });
      },
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: true },
    );
  }, [moveTo, pick, t.geoNotSupported, t.locationBlocked, t.geoFailed]);

  // First visit (no delivery city yet): ask for location permission as soon as the map is ready.
  useEffect(() => {
    if (!mapsReady || savedCity || autoAsked.current) return;
    autoAsked.current = true;
    void detectLocation();
  }, [mapsReady, savedCity, detectLocation]);

  // a different city means a new cart: when the cart has items the visitor is asked first (the old shop's question, word for word)
  const [askClearCart, setAskClearCart] = useState(false);
  const cartHasItems = () => {
    try { const raw: unknown = JSON.parse(window.localStorage.getItem("tazahat-cart-v1") ?? "[]"); return Array.isArray(raw) && raw.length > 0; } catch { return false; }
  };
  const confirm = async (cartAnswered = false) => {
    if (!verdict?.serviceable || saving) return;
    if (!cartAnswered && savedCity && savedCity.id !== verdict.city.id && cartHasItems()) { setAskClearCart(true); return; }
    setAskClearCart(false);
    setSaving(true);
    const changedCity = !savedCity || savedCity.id !== verdict.city.id;
    const res = await selectCityAction(verdict.city, verdict.pincode, address).catch(() => ({ ok: false }));
    if (res.ok && changedCity) window.dispatchEvent(new Event("tazahat:clear-cart"));
    if (!res.ok) {
      setSaving(false);
      return setVerdict({ serviceable: false, message: t.citySaveError });
    }
    router.refresh();
    closeWithAnimation();
  };

  const selectedCityId = verdict?.serviceable ? verdict.city.id : "";

  return (
    <div className={`location-backdrop${isClosing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeWithAnimation(); }}>
      <section className="location-modal" role="dialog" aria-modal="true" aria-labelledby="location-title" lang={t.language}>
        <header className="location-modal-header">
          <div className="location-header-main">
            <span className="location-header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </span>
            <div className="location-header-copy">
              <h2 id="location-title" className="location-header-title">
                {t.titlePrefix} <span>{t.titleHighlight}</span>
              </h2>
              <p className="location-header-subtitle">{t.subtitle}</p>
            </div>
          </div>

          <div className="location-header-actions">
            <button type="button" className="location-close" onClick={() => closeWithAnimation()} aria-label={t.closeAria}>×</button>
          </div>
        </header>

        <div className="location-content">
          <section className="location-map-section" aria-label={t.deliveryMapAria}>
            <div className="location-map">
              <div ref={mapElementRef} className="location-map-canvas" role="application" aria-label={t.interactiveMapAria} />
              {mapError && <p className="location-map-error">{mapError} {t.stillPickCity}</p>}
              {/* search and "use my location" sit on top of the map */}
              <div className="location-map-toolbar">
                <label className="location-map-search-field">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                  <input ref={searchInputRef} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
                </label>
              </div>
              {/* "use my current location": an icon above the zoom buttons (both sit mid-height on the right, clear of the address caption) */}
              <button type="button" className="location-map-locate" onClick={() => void detectLocation()} disabled={busy} aria-label={t.useCurrentLocation} title={t.useCurrentLocation}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22"/><circle cx="12" cy="12" r="7.4"/></svg>
              </button>
              <span className="location-map-caption">{busy ? t.checkingLocation : verdict?.serviceable ? t.deliveryAreaCaption.replace("{location}", `${verdict.city.name}${verdict.pincode ? `, ${verdict.pincode}` : ""}`) : t.dragPinCaption}</span>
            </div>
          </section>

          <div className={`location-current${verdict && !verdict.serviceable ? " is-unavailable" : ""}`}>
            <span className="location-current-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
            <span><small>{verdict?.serviceable ? t.weDeliverHere : t.selectedLocation}</small><strong>{address || t.noLocationSelected}</strong></span>
            {verdict?.serviceable && <span className="location-current-check" aria-label={t.deliveryAvailableAria}>✓</span>}
          </div>
          {verdict && !verdict.serviceable && <p className="location-unavailable" role="alert">{verdict.message}</p>}

          <div className="location-popular-heading"><span>{t.deliveryCitiesHeading}</span><span className="location-heading-rule" /></div>
          <div className="location-chips">
            {citiesError && <p className="location-no-results">{citiesError}</p>}
            {!citiesError && cities.length === 0 && <p className="location-no-results">{t.loadingCities}</p>}
            {cities.map((city, index) => (
              <button type="button" key={city.id} className={`location-chip${selectedCityId === city.id ? " is-selected" : ""}`} style={{ "--chip-index": index } as React.CSSProperties} onClick={() => void chooseCity(city)}>{city.name}</button>
            ))}
          </div>
        </div>
        <div className="location-actions">
          <button type="button" className="location-confirm" onClick={() => void confirm(false)} disabled={!verdict?.serviceable || busy || saving}>
            {verdict?.serviceable ? t.deliverToCity.replace("{city}", verdict.city.name) : t.chooseLocationBtn}
          </button>
        </div>
        {askClearCart && (
          <div className="location-confirm-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="location-clear-title">
            <div className="location-confirm-box">
              <span className="location-confirm-icon" aria-hidden="true">i</span>
              <h3 id="location-clear-title">Confirmation Message!</h3>
              <p>Change Service City will remove all the items previously added in your cart. Do you want to continue?</p>
              <div className="location-confirm-buttons">
                <button type="button" className="location-confirm-yes" onClick={() => void confirm(true)}>Yes</button>
                <button type="button" className="location-confirm-no" onClick={() => setAskClearCart(false)}>No</button>
              </div>
            </div>
          </div>
        )}
        <div className="location-modal-footer"><span>{t.footerFreshness}</span><span className="location-footer-dot" /> {t.brandName}</div>
      </section>
    </div>
  );
}
