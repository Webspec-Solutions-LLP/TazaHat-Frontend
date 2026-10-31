/// <reference types="google.maps" />

// The Google Maps script (loaded in src/lib/googleMaps.ts) puts `google` on window.
declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
