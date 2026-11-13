import "server-only";
import { headers } from "next/headers";
import { getSiteSettings } from "./api";

/** the address this site is reached at (search engines and share cards need absolute addresses) */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const absoluteUrl = (origin: string, value: string | null | undefined) => (value ? (/^https?:\/\//i.test(value) ? value : `${origin}${value.startsWith("/") ? "" : "/"}${value}`) : null);

/** the fonts the CRM can pick for the shop name (Settings > General > Name font); anything else is ignored */
const BRAND_FONTS = ["Poppins", "Rubik", "Open Sans", "Roboto", "Source Sans Pro", "Ubuntu", "Montserrat", "Lato", "Nunito", "Itim", "Pacifico"];

/** the shop's identity for this request: its name and the absolute addresses of the logo and the favicon uploaded in the CRM */
export async function getSiteIdentity() {
  const [s, origin] = await Promise.all([getSiteSettings(), siteOrigin()]);
  // ?v=<time the settings were last saved>: a new logo / favicon has a new address, so no browser or CDN keeps showing the old one
  const v = s.updatedAt ? encodeURIComponent(s.updatedAt) : "";
  const ver = (u: string | null | undefined) => (u && v ? `${u}${u.includes("?") ? "&" : "?"}v=${v}` : u || "");
  const font = BRAND_FONTS.includes(s.brandFont ?? "") ? (s.brandFont as string) : "";
  return { origin, v, font, name: s.appName || "Our store", tagline: s.tagline?.trim() || "", logoPath: ver(s.logoUrl), noImagePath: ver(s.noImageUrl), logo: absoluteUrl(origin, ver(s.logoUrl)) ?? `${origin}/images/logo.webp`, favicon: absoluteUrl(origin, ver(s.faviconUrl)) ?? absoluteUrl(origin, ver(s.logoUrl)) ?? `${origin}/images/logo.webp`, phone: s.supportPhone, email: s.supportEmail };
}

/** the tab / share-card title: the name, then the tagline set in the CRM when there is one */
export const siteTitle = (id: { name: string; tagline: string }) => (id.tagline ? `${id.name} | ${id.tagline}` : id.name);
export const SITE_DESCRIPTION = "Order fresh fish, meat, poultry, vegetables, fruit and everyday groceries online. Cut and cleaned the way you like, delivered fresh in the time slot you choose.";
