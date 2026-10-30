"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Circle as LeafletCircle, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "./Location.css";

interface LocationProps {
  deliveryLocation: string;
  onClose: () => void;
  onLogin: () => void;
}

const popularLocations = ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Jalpaiguri"];
const cityMapPoints = [
  { city: "Kolkata", latitude: 22.5726, longitude: 88.3639 },
  { city: "Howrah", latitude: 22.5958, longitude: 88.2636 },
  { city: "Siliguri", latitude: 26.7271, longitude: 88.3953 },
  { city: "Durgapur", latitude: 23.5204, longitude: 87.3119 },
  { city: "Asansol", latitude: 23.6739, longitude: 86.9524 },
  { city: "Jalpaiguri", latitude: 26.5167, longitude: 88.7333 },
];

function nearestCity(latitude: number, longitude: number) {
  return cityMapPoints.reduce((nearest, city) => {
    const distance = Math.hypot(city.latitude - latitude, (city.longitude - longitude) * Math.cos((latitude * Math.PI) / 180));
    const nearestDistance = Math.hypot(nearest.latitude - latitude, (nearest.longitude - longitude) * Math.cos((latitude * Math.PI) / 180));
    return distance < nearestDistance ? city : nearest;
  });
}

export default function Location({ deliveryLocation, onClose, onLogin }: LocationProps) {
  const [query, setQuery] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    cityMapPoints.find(({ city }) => deliveryLocation.toLowerCase().includes(city.toLowerCase()))?.city ?? "",
  );
  const [currentLocation, setCurrentLocation] = useState(deliveryLocation);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const radiusRef = useRef<LeafletCircle | null>(null);
  const initialCityRef = useRef(cityMapPoints.find(({ city }) => deliveryLocation.toLowerCase().includes(city.toLowerCase())) ?? cityMapPoints[0]);

  useEffect(() => {
    let isCancelled = false;
    let map: LeafletMap | undefined;

    void import("leaflet").then((leaflet) => {
      if (isCancelled || !mapElementRef.current) return;

      const initialCity = initialCityRef.current;
      const initialPosition: [number, number] = [initialCity.latitude, initialCity.longitude];
      map = leaflet.map(mapElementRef.current, { center: initialPosition, zoom: 11, zoomControl: false });
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      leaflet.control.zoom({ position: "topright" }).addTo(map);

      const radius = leaflet.circle(initialPosition, {
        radius: 20000,
        color: "#0878ff",
        weight: 3,
        fillColor: "#0878ff",
        fillOpacity: 0.12,
      }).addTo(map);
      const marker = leaflet.marker(initialPosition, {
        draggable: true,
        icon: leaflet.divIcon({
          className: "location-pin-icon",
          html: '<span class="location-pin-head"><span></span></span>',
          iconSize: [42, 52],
          iconAnchor: [21, 49],
        }),
      }).addTo(map);

      marker.on("drag", () => radius.setLatLng(marker.getLatLng()));
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        const city = nearestCity(position.lat, position.lng);
        setSelectedCity(city.city);
        setCurrentLocation(`${city.city}, West Bengal`);
      });

      mapRef.current = map;
      markerRef.current = marker;
      radiusRef.current = radius;
      window.requestAnimationFrame(() => map?.invalidateSize());
    }).catch((error: unknown) => {
      console.error("Unable to load the delivery map.", error);
    });

    return () => {
      isCancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
      radiusRef.current = null;
    };
  }, []);

  const closeWithAnimation = useCallback((afterClose: () => void = onClose) => {
    if (isClosing) return;
    setIsClosing(true);
    const closeDuration = window.matchMedia("(max-width: 575px)").matches ? 560 : 380;
    window.setTimeout(afterClose, closeDuration);
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

  const selectLocation = (location: string) => {
    setSelectedCity(location);
    setCurrentLocation(`${location}, West Bengal`);
    const city = cityMapPoints.find(({ city: cityName }) => cityName === location);
    if (!city || !mapRef.current || !markerRef.current || !radiusRef.current) return;

    const position: [number, number] = [city.latitude, city.longitude];
    markerRef.current.setLatLng(position);
    radiusRef.current.setLatLng(position);
    mapRef.current.flyTo(position, 11);
  };

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
            <p>Choose where you’d like your TazaHaat order delivered.</p>
          </div>

          <section className="location-map-section" aria-label="City map">
            <div className="location-map">
                <div ref={mapElementRef} className="location-map-canvas" role="application" aria-label="Interactive delivery map. Drag the pin to choose a location." />
                <div className={`location-map-search${isSearchOpen ? " is-open" : ""}`}>
                  {isSearchOpen && (
                    <label className="location-map-search-field">
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city or area" aria-label="Search city or area" autoFocus />
                      {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
                    </label>
                  )}
                  <button
                    type="button"
                    className="location-map-search-toggle"
                    onClick={() => {
                      setIsSearchOpen((isOpen) => !isOpen);
                      if (isSearchOpen) setQuery("");
                    }}
                    aria-label={isSearchOpen ? "Close city search" : "Search city or area"}
                    aria-expanded={isSearchOpen}
                  >
                    {isSearchOpen ? <span aria-hidden="true">×</span> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>}
                  </button>
                </div>
                <span className="location-map-caption">{selectedCity ? `Delivery area · ${selectedCity}` : "West Bengal, India"}</span>
            </div>
          </section>

          <div className="location-current">
            <span className="location-current-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
            <span><small>Current delivery location</small><strong>{currentLocation}</strong></span>
            <span className="location-current-check" aria-label="Selected">✓</span>
          </div>

          <div className="location-popular-heading"><span>{query ? "Matching cities" : "Popular near you"}</span><span className="location-heading-rule" /></div>
          <div className="location-chips">
            {popularLocations.filter((city) => city.toLowerCase().includes(query.toLowerCase())).map((city, index) => (
              <button type="button" key={city} className={`location-chip${selectedCity === city ? " is-selected" : ""}`} style={{ "--chip-index": index } as React.CSSProperties} onClick={() => selectLocation(city)}>{city}</button>
            ))}
            {popularLocations.every((city) => !city.toLowerCase().includes(query.toLowerCase())) && <p className="location-no-results">No matching city yet. Try another search.</p>}
          </div>
        </div>
        <div className="location-modal-footer"><span>Delivering freshness across West Bengal</span><span className="location-footer-dot" /> TazaHaat</div>
      </section>
    </div>
  );
}
