import "server-only";
import type { ApiCard, ApiCity, ApiFacetCategory, ApiProductDetail, Serviceability, ShopHome } from "../api";

/**
 * Every call to the TazaHat backend goes through here, on the server. The browser only ever talks to this site, so the API
 * address, its responses and the Google key used for address lookup never show in the Network tab.
 */
const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  const res = await fetch(`${API_BASE}/api/public${path}${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: T } | null;
  if (!res.ok || json?.status !== "success" || json.data === undefined) throw new Error(json?.message ?? "Could not reach the server.");
  return json.data;
}

export interface ShopProductPage { items: ApiCard[]; total: number; page: number; limit: number }
export const getShopProducts = (cityId: string, page: number, limit: number) =>
  get<ShopProductPage>("/shop/products", { cityId, page: String(page), limit: String(limit) });
export interface CatalogQuery { category?: string; sub?: string; q?: string; sort?: string; maxPrice?: string }
export const getShopCatalog = (cityId: string, query: CatalogQuery, page: number, limit: number) =>
  get<ShopProductPage>("/shop/products", { cityId, ...query, page: String(page), limit: String(limit) });
export const getShopCategories = (cityId: string) => get<{ categories: ApiFacetCategory[] }>("/shop/categories", { cityId }).then((d) => d.categories);
export const getShopCategoryPage = (cityId: string, page: number, limit: number) =>
  get<{ categories: ApiFacetCategory[]; total: number; page: number; limit: number }>("/shop/categories", { cityId, page: String(page), limit: String(limit) });
export const getShopProduct = (cityId: string, slug: string) => get<ApiProductDetail>(`/shop/products/${encodeURIComponent(slug)}`, { cityId });
export const getCities = () => get<{ cities: ApiCity[] }>("/cities").then((d) => d.cities);
export const getShopHome = (cityId: string) => get<ShopHome>("/shop/home", { cityId });
export const checkServiceability = (q: { pincode?: string; city?: string }) => get<Serviceability>("/serviceability", q);
