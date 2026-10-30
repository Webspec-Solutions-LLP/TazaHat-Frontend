"use client";

import { createContext, useContext } from "react";

export interface SelectedCity { id: string; name: string }

export const OPEN_LOCATION_EVENT = "tazahat:open-location";

const CityContext = createContext<SelectedCity | null>(null);

/** Gives the delivery city (read from the cookie on the server) to the components below. */
export const CityProvider = CityContext.Provider;

/** The delivery city the visitor chose, or null when none yet. */
export function useCity(): { city: SelectedCity | null; ready: boolean } {
  return { city: useContext(CityContext), ready: true };
}

export const openLocationPicker = () => window.dispatchEvent(new Event(OPEN_LOCATION_EVENT));
