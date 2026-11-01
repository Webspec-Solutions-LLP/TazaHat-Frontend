"use server";

import { revalidatePath } from "next/cache";
import { readPlace, type GeocodeResult } from "@/lib/places";
import { checkServiceability, checkShopCart, getCities, getShopCatalog, getShopCategoryPage, getShopProduct, getShopProducts, type CatalogQuery } from "@/lib/server/api";
import { readCityCookie, writeCityCookie } from "@/lib/server/city";
import { cardToProduct, type CartLineCheck, categoryToItem, type ApiCity, type ApiProductDetail, type Product } from "@/lib/api";
import type { CategoryTile } from "@/components/category/Category";

/**
 * Server actions: the only way the browser asks for data. They run on this site's server, which talks to the backend and to
 * Google's Geocoding API, so none of those addresses or answers appear in the browser's Network tab.
 */

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function geocode(params: Record<string, string>): Promise<{ results: (GeocodeResult & { geometry?: { location: { lat: number; lng: number } } })[] }> {
  if (!GOOGLE_KEY) throw new Error("Address lookup is not configured.");
  const qs = new URLSearchParams({ ...params, key: GOOGLE_KEY, language: "en", region: "in" });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${qs}`, { cache: "no-store" });
  const json = (await res.json()) as { status: string; results: never[] };
  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") throw new Error("Address lookup failed.");
  return { results: json.results };
}

export async function listCitiesAction(): Promise<{ cities?: ApiCity[]; error?: string }> {
  try {
    return { cities: await getCities() };
  } catch {
    return { error: "We could not load the delivery cities. Please try again." };
  }
}

export type LocationCheck =
  | { ok: true; address: string; serviceable: true; city: ApiCity }
  | { ok: true; address: string; serviceable: false; message: string }
  | { ok: false; error: string };

/** A map pin (latitude / longitude) -> address, pincode -> the delivery city that serves it (if any). */
export async function checkLocationAction(lat: number, lng: number): Promise<LocationCheck> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, error: "Invalid location." };
  try {
    const place = readPlace((await geocode({ latlng: `${lat},${lng}` })).results);
    const found = await checkServiceability({ pincode: /^\d{6}$/.test(place.pincode) ? place.pincode : undefined, city: place.cityName || undefined });
    const address = place.address || "Selected location";
    return found.serviceable && found.city
      ? { ok: true, address, serviceable: true, city: found.city }
      : { ok: true, address, serviceable: false, message: found.message ?? "TazaHat does not deliver to this location yet. Please wait, we are coming to this area soon." };
  } catch {
    return { ok: false, error: "We could not check this location. Please try again or pick a city below." };
  }
}

/** Where is this city on the map (to centre the map when a city chip is chosen). */
export async function locateCityAction(name: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const spot = (await geocode({ address: `${name.slice(0, 80)}, India` })).results[0]?.geometry?.location;
    return spot ?? null;
  } catch {
    return null;
  }
}

/** Remember the visitor's delivery city (cookie) and refresh the page data for it. */
export async function selectCityAction(city: ApiCity): Promise<{ ok: boolean }> {
  const cities = await getCities().catch(() => [] as ApiCity[]);
  const real = cities.find((c) => c.id === city.id);
  if (!real) return { ok: false };
  await writeCityCookie({ id: real.id, name: real.name });
  revalidatePath("/", "layout");
  return { ok: true };
}

const PRODUCTS_PAGE_SIZE = 10;

/** The next page of the home page's "all products" list for the visitor's city (10 at a time). */
export async function loadProductsAction(page: number): Promise<{ products: Product[]; hasMore: boolean; total: number } | { error: string }> {
  const city = await readCityCookie();
  if (!city) return { error: "Choose your delivery city first." };
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  try {
    const res = await getShopProducts(city.id, p, PRODUCTS_PAGE_SIZE);
    return { products: res.items.map(cardToProduct), hasMore: res.page * res.limit < res.total, total: res.total };
  } catch {
    return { error: "We could not load more products. Please try again." };
  }
}

const CATALOG_PAGE_SIZE = 20;

/** One page of the products page (filters and sort come from the address bar of the page), 20 at a time. */
export async function loadCatalogPageAction(query: CatalogQuery, page: number): Promise<{ products: Product[]; hasMore: boolean; total: number } | { error: string }> {
  const city = await readCityCookie();
  if (!city) return { error: "Choose your delivery city first." };
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  const clean: CatalogQuery = {
    category: typeof query.category === "string" ? query.category.slice(0, 120) : undefined,
    sub: typeof query.sub === "string" ? query.sub.slice(0, 120) : undefined,
    q: typeof query.q === "string" ? query.q.slice(0, 80) : undefined,
    sort: typeof query.sort === "string" ? query.sort.slice(0, 20) : undefined,
    maxPrice: typeof query.maxPrice === "string" ? query.maxPrice.slice(0, 8) : undefined,
  };
  try {
    const res = await getShopCatalog(city.id, clean, p, CATALOG_PAGE_SIZE);
    return { products: res.items.map(cardToProduct), hasMore: res.page * res.limit < res.total, total: res.total };
  } catch {
    return { error: "We could not load products. Please try again." };
  }
}

/** One product as the product page shows it (packs, dressing types, pictures, description, related products): for the quick view. */
export async function getProductDetailAction(slug: string): Promise<ApiProductDetail | null> {
  const city = await readCityCookie();
  const clean = String(slug ?? "").trim().slice(0, 160);
  if (!city || !clean) return null;
  try {
    let detail = await getShopProduct(city.id, clean);
    if (detail.redirectSlug) detail = await getShopProduct(city.id, detail.redirectSlug); // the product was renamed
    return detail.packs ? detail : null;
  } catch {
    return null;
  }
}

/** Re-checks the cart's lines against the shop for the visitor's city: still sold, in stock, today's price, dressing still offered. null = could not check. */
export async function checkCartAction(lines: { variantId: string; cuttingTypeId?: string | null }[]): Promise<CartLineCheck[] | null> {
  const city = await readCityCookie();
  const clean = (Array.isArray(lines) ? lines : []).filter((l) => l && typeof l.variantId === "string" && l.variantId).slice(0, 100)
    .map((l) => ({ variantId: l.variantId.slice(0, 60), cuttingTypeId: typeof l.cuttingTypeId === "string" ? l.cuttingTypeId.slice(0, 60) : null }));
  if (!city || !clean.length) return null;
  try { return await checkShopCart(city.id, clean); } catch { return null; }
}

/** The wishlist's products (by their slugs) as they are sold in the visitor's city, in the order of the list; the ones not sold there are left out. */
export async function loadWishlistProductsAction(slugs: string[]): Promise<Product[]> {
  const city = await readCityCookie();
  const clean = [...new Set(slugs.filter((s) => typeof s === "string" && /^[\w-]{1,160}$/.test(s)))].slice(0, 60);
  if (!city || !clean.length) return [];
  try {
    const res = await getShopCatalog(city.id, { slugs: clean.join(",") }, 1, 60);
    const bySlug = new Map(res.items.map((c) => [c.slug, c]));
    return clean.map((s) => bySlug.get(s)).filter((c): c is NonNullable<typeof c> => !!c).map(cardToProduct);
  } catch {
    return [];
  }
}

const SHELF_PAGE_SIZE = 10;

/** The next 10 products of a home page shelf: the ones that start selling on a later day, or the sold out ones. */
export async function loadAvailabilityAction(kind: "upcoming" | "soldout", page: number): Promise<{ products: Product[]; hasMore: boolean; total: number } | { error: string }> {
  const city = await readCityCookie();
  if (!city) return { error: "Choose your delivery city first." };
  if (kind !== "upcoming" && kind !== "soldout") return { error: "Unknown list." };
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  try {
    const res = await getShopCatalog(city.id, { availability: kind }, p, SHELF_PAGE_SIZE);
    return { products: res.items.map(cardToProduct), hasMore: res.page * res.limit < res.total, total: res.total };
  } catch {
    return { error: "We could not load more products. Please try again." };
  }
}

/** Search-as-you-type suggestions for the navbar. */
export async function searchSuggestionsAction(q: string): Promise<Product[]> {
  const city = await readCityCookie();
  const text = String(q ?? "").trim().slice(0, 60);
  if (!city || text.length < 2) return [];
  try {
    return (await getShopCatalog(city.id, { q: text }, 1, 6)).items.map(cardToProduct);
  } catch {
    return [];
  }
}

const CATEGORY_PAGE_SIZE = 12;

/** One page of the all-categories list (12 at a time, more as the visitor scrolls). */
export async function loadCategoriesAction(page: number): Promise<{ items: CategoryTile[]; hasMore: boolean } | { error: string }> {
  const city = await readCityCookie();
  if (!city) return { error: "Choose your delivery city first." };
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  try {
    const res = await getShopCategoryPage(city.id, p, CATEGORY_PAGE_SIZE);
    return { items: res.categories.map((c, i) => categoryToItem(c, (p - 1) * CATEGORY_PAGE_SIZE + i)), hasMore: res.page * res.limit < res.total };
  } catch {
    return { error: "We could not load more categories. Please try again." };
  }
}
