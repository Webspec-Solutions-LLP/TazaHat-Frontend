import "server-only";
import { cookies } from "next/headers";
import type { SelectedCity } from "../city";

export const CITY_COOKIE = "tazahat_city";

/** The delivery city this visitor chose (kept in an httpOnly cookie: only the server reads it). */
export async function readCityCookie(): Promise<SelectedCity | null> {
  const raw = (await cookies()).get(CITY_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(decodeURIComponent(raw));
    if (v && typeof v === "object" && typeof (v as SelectedCity).id === "string" && typeof (v as SelectedCity).name === "string") return v as SelectedCity;
  } catch {
    // malformed cookie: treat as not chosen
  }
  return null;
}

export async function writeCityCookie(city: SelectedCity) {
  (await cookies()).set(CITY_COOKIE, encodeURIComponent(JSON.stringify(city)), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}
