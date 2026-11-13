/**
 * The shop's name and tagline from CRM > Settings > General. Nothing in the site spells them out: language files use the `{brand}` and
 * `{tagline}` placeholders, and code reads them from `useBrand()` (lib/brand.tsx). English only for now.
 * This file has no "use client" so server and client components can both use it.
 */
/** noImage: shown wherever a picture is missing; logo: the shop logo. Both from the CRM, the built-in file until one is uploaded. */
export type Brand = { name: string; tagline: string; noImage?: string; logo?: string };
export const DEFAULT_LOGO = "/images/logo.webp";

let current: Brand = { name: "Our store", tagline: "", noImage: DEFAULT_LOGO, logo: DEFAULT_LOGO };
/** the layout sets this on every render (server and browser) so the text below fills in with the saved name */
export function setBrand(b: Brand) { current = { ...b, logo: b.logo || DEFAULT_LOGO, noImage: b.noImage || b.logo || DEFAULT_LOGO }; }
/** the picture for a missing image (read when rendering, the CRM value is only known at run time) */
export const placeholderImage = () => current.noImage || DEFAULT_LOGO;
export const getBrand = () => current;

const fill = (s: string) => (s.includes("{") ? s.replaceAll("{brand}", current.name).replaceAll("{tagline}", current.tagline) : s);

/**
 * Wraps a language file so every string read from it has its `{brand}` / `{tagline}` filled in at the moment it is read (the name is only
 * known at run time, the files are loaded once).
 */
export function brandify<T>(raw: T): T {
  const wrap = (v: unknown): unknown => {
    if (typeof v === "string") return fill(v);
    if (v && typeof v === "object") return new Proxy(v as object, { get: (t, k, r) => wrap(Reflect.get(t, k, r)) });
    return v;
  };
  return wrap(raw) as T;
}
