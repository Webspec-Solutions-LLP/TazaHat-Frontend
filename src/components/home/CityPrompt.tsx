"use client";

import { openLocationPicker } from "@/lib/city";

/** Shown on the home page until the visitor has chosen a delivery city. */
export default function CityPrompt() {
  return (
    <section className="home-city-prompt" aria-live="polite">
      <h2>Where should we deliver?</h2>
      <p>Choose your delivery location to see the fresh products available near you.</p>
      <button type="button" onClick={openLocationPicker}>Choose delivery location</button>
    </section>
  );
}
