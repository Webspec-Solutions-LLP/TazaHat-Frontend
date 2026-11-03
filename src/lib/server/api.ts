import "server-only";
import type { CartLineCheck, ApiCard, ApiCity, ApiFacetCategory, ApiProductDetail, Serviceability, ShopHome } from "../api";

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
/** `availability`: "upcoming" (nothing can be ordered yet, starts on a later day) or "soldout" (visible but sold out), for the home page shelves */
export interface CatalogQuery { category?: string; sub?: string; q?: string; sort?: string; maxPrice?: string; availability?: "upcoming" | "soldout"; /** comma separated product slugs: the favourites page */ slugs?: string }
export const getShopCatalog = (cityId: string, query: CatalogQuery, page: number, limit: number) =>
  get<ShopProductPage>("/shop/products", { cityId, ...query, page: String(page), limit: String(limit) });
export const getShopCategories = (cityId: string) => get<{ categories: ApiFacetCategory[] }>("/shop/categories", { cityId }).then((d) => d.categories);
export const getShopCategoryPage = (cityId: string, page: number, limit: number) =>
  get<{ categories: ApiFacetCategory[]; total: number; page: number; limit: number }>("/shop/categories", { cityId, page: String(page), limit: String(limit) });
/** the name, text and picture a shared link shows: the same for every city */
export const getProductShare = (slug: string) => get<ProductShare>(`/shop/products/${encodeURIComponent(slug)}/share`);
export const getShopProduct = (cityId: string, slug: string) => get<ApiProductDetail>(`/shop/products/${encodeURIComponent(slug)}`, { cityId });
export async function getCartRelated(cityId: string, slugs: string[]): Promise<ApiCard[]> {
  const res = await fetch(`${API_BASE}/api/public/shop/cart/related`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cityId, slugs }), cache: "no-store" });
  const json = (await res.json().catch(() => null)) as { status?: string; data?: { items: ApiCard[] } } | null;
  if (!res.ok || json?.status !== "success" || !json.data) throw new Error("Could not reach the server.");
  return json.data.items;
}
export async function checkShopCart(cityId: string, lines: { variantId: string; cuttingTypeId?: string | null }[]): Promise<CartLineCheck[]> {
  const res = await fetch(`${API_BASE}/api/public/shop/cart/check`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cityId, lines }), cache: "no-store" });
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: { lines: CartLineCheck[] } } | null;
  if (!res.ok || json?.status !== "success" || !json.data) throw new Error(json?.message ?? "Could not reach the server.");
  return json.data.lines;
}
export interface PushConfig { enabled: boolean; config?: { apiKey: string; projectId: string; messagingSenderId: string; appId: string; authDomain: string | null }; vapidKey?: string | null }
/** the Firebase web app config for browser notifications (CRM: Settings > Push); `enabled: false` until it is filled in */
export const getPushConfig = () => get<PushConfig>("/push-config").catch(() => ({ enabled: false }) as PushConfig);
export type AppLink = { state: "link"; url: string } | { state: "soon" | "hidden"; url: null };
/** the footer's store buttons, set in the CRM (Settings > App links); when the shop cannot be reached both say "Coming soon" */
export const getAppLinks = () => get<{ android: AppLink; ios: AppLink }>("/app-links").catch(() => ({ android: { state: "soon", url: null }, ios: { state: "soon", url: null } }) as { android: AppLink; ios: AppLink });
export const getCities = () => get<{ cities: ApiCity[] }>("/cities").then((d) => d.cities);
export const getShopHome = (cityId: string) => get<ShopHome>("/shop/home", { cityId });
export const checkServiceability = (q: { pincode?: string; city?: string }) => get<Serviceability>("/serviceability", q);

/** the CRM's switches for the floating buttons (all on when the shop cannot be reached) */
export const getUiConfig = () => get<{ feedbackButton: boolean }>("/ui-config").catch(() => ({ feedbackButton: true }));

/** the legal documents written in the CRM (Privacy Policy, Terms ...): the published ones, and where each shows */
export type LegalListItem = { slug: string; title: string; footer: boolean; login: boolean; updatedAt: string };
export type LegalDoc = { slug: string; title: string; html: string; updatedAt: string };
export const getLegalList = () => get<{ documents: LegalListItem[] }>("/legal").then((d) => d.documents).catch(() => [] as LegalListItem[]);
export const getLegalDoc = (slug: string) => get<LegalDoc>(`/legal/${encodeURIComponent(slug)}`);

/** the shop's name, logo and favicon (CRM > Settings > General): what the browser tab, the share cards and the search results carry */
export type SiteSettings = { appName: string; supportPhone: string | null; supportEmail: string | null; logoUrl: string | null; faviconUrl: string | null };
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, { next: { revalidate: 300 } });
    const json = (await res.json()) as { status?: string; data?: SiteSettings };
    if (res.ok && json.status === "success" && json.data) return json.data;
  } catch { /* the defaults below */ }
  return { appName: "TazaHat", supportPhone: null, supportEmail: null, logoUrl: null, faviconUrl: null };
}

export type SitemapData = { products: { slug: string; updatedAt: string }[]; categories: { slug: string; subs: string[] }[]; legal: { slug: string; updatedAt: string }[] };
export const getSitemapData = () => get<SitemapData>("/sitemap").catch(() => ({ products: [], categories: [], legal: [] }) as SitemapData);

/** the picture, name and price range of a product, the same for every city (link previews and the product's structured data) */
export type ProductShare = { slug: string; name: string; description: string; image: string | null; images?: string[]; updatedAt?: string; category?: { name: string; slug: string }; subCategory?: { name: string; slug: string }; price?: { lowPaisa: number; highPaisa: number | null; inStock: boolean } | null };
