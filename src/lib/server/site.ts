import "server-only";
import { headers } from "next/headers";
import { getSiteSettings } from "./api";

/** the address this site is reached at (search engines and share cards need absolute addresses) */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "https://tazahat.in";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const absoluteUrl = (origin: string, value: string | null | undefined) => (value ? (/^https?:\/\//i.test(value) ? value : `${origin}${value.startsWith("/") ? "" : "/"}${value}`) : null);

/** the shop's identity for this request: its name and the absolute addresses of the logo and the favicon uploaded in the CRM */
export async function getSiteIdentity() {
  const [s, origin] = await Promise.all([getSiteSettings(), siteOrigin()]);
  return { origin, name: s.appName || "TazaHat", logo: absoluteUrl(origin, s.logoUrl) ?? `${origin}/images/logo.webp`, favicon: absoluteUrl(origin, s.faviconUrl) ?? absoluteUrl(origin, s.logoUrl) ?? `${origin}/images/logo.webp`, phone: s.supportPhone, email: s.supportEmail };
}

export const SITE_TAGLINE = "Fresh fish, meat, vegetables and groceries delivered to your door";
export const SITE_DESCRIPTION = "Order fresh fish, meat, poultry, vegetables, fruit and everyday groceries online. Cut and cleaned the way you like, delivered fresh in the time slot you choose.";
