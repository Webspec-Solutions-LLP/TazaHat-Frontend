let loading: Promise<typeof google> | null = null;

/** Loads the Google Maps JavaScript API once (key from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("Maps need a browser."));
  if (window.google?.maps?.Map) return Promise.resolve(window.google);
  if (loading) return loading;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("Google Maps key is missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)."));
  loading = new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    w.__tazahatMapsReady = () => resolve(window.google);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&callback=__tazahatMapsReady`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Maps could not be loaded."));
    };
    document.head.appendChild(script);
  });
  return loading;
}
