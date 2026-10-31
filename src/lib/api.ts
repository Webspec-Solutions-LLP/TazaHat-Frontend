import type { SyntheticEvent } from "react";
import catalog from "@/components/products/english.json";

/** The shape every product card / modal in the UI already uses. */
export type Product = (typeof catalog.products)[number];

export const PLACEHOLDER_IMAGE = "/images/logo.webp";

/** API pictures come as "/uploads/..." (served through this site, see next.config.ts) or as full URLs. */
export function mediaSrc(url?: string | null): string {
  if (!url) return PLACEHOLDER_IMAGE;
  return /^https?:\/\//.test(url) || url.startsWith("/") ? url : `/uploads/${url}`;
}

/** Pictures from the API are already sized: skip the image optimiser for them. */
export const isRemoteImage = (src: string) => !src.startsWith("/images/");

/** onError for <Image>: show the logo instead of a broken picture. */
export function fallbackImage(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (!img.src.endsWith(PLACEHOLDER_IMAGE)) {
    img.removeAttribute("srcset");
    img.src = PLACEHOLDER_IMAGE;
  }
}

export interface ApiCity { id: string; name: string }
export interface ApiCard {
  id: string; slug: string; name: string; image: string | null; unit: string | null;
  categoryName: string; categorySlug: string; subCategoryName: string; subCategorySlug: string;
  pricePaisa: number | null; mrpPaisa: number | null; discountPercent: number; fromLabel: string | null;
  packCount: number; inStock: boolean; perUnitPaisa: number | null; endsOn: string | null;
  packs: ApiPack[];
}
export interface ApiPack { id: string; label: string; amount: number; unit: string; pricePaisa: number; mrpPaisa: number; inStock: boolean }
export interface ApiHomeCategory { id: string; name: string; slug: string; imageUrl: string | null; subCategories: { id: string; name: string; slug: string }[] }
export interface ShopHome {
  cities: ApiCity[];
  city: ApiCity | null;
  categories: ApiHomeCategory[];
  banners: { id: string; image: string | null; title: string | null; details: string | null; href: string | null }[];
  offers: { maxDiscount: number; items: ApiCard[] };
  special: ApiCard[];
  bestSellers: ApiCard[];
  bestSellerGroups: { id: string; name: string; slug: string; more: number; images: string[] }[];
  categoryDiscounts: { id: string; name: string; slug: string; imageUrl: string | null; maxDiscount: number }[];
  latest: ApiCard[];
  sections: { category: { name: string; slug: string; imageUrl: string | null }; products: ApiCard[] }[];
}
export interface Serviceability {
  serviceable: boolean;
  matchedBy?: "pincode" | "city";
  city: ApiCity | null;
  area: { id: string; name: string } | null;
  message?: string;
}

/** "Bengali Sweets (দই-মিষ্টি )" -> "Bengali Sweets" */
export const shortName = (name: string) => name.split(" (")[0].split(" / ")[0].trim() || name;

/** Pack sizes come as "500 gm": show the price per kg / litre like the rest of the UI (gm -> kg, ml -> L). */
function packUnit(amount: number, unit: string): { amount: number; unit: string } {
  const u = unit.toLowerCase();
  if (["gm", "g", "gram", "grams"].includes(u)) return { amount: amount / 1000, unit: "kg" };
  if (["ml", "milliliter", "millilitre"].includes(u)) return { amount: amount / 1000, unit: "L" };
  if (["l", "ltr", "litre", "liter"].includes(u)) return { amount, unit: "L" };
  return { amount: amount > 0 ? amount : 1, unit: unit || "pack" };
}

/** An API product card in the shape the existing product components expect. Ratings are not in the API, so they stay 0 (and are hidden). */
export function cardToProduct(c: ApiCard): Product {
  const price = Math.round((c.pricePaisa ?? 0) / 100);
  const mrp = Math.round((c.mrpPaisa ?? c.pricePaisa ?? 0) / 100);
  const label = c.fromLabel ?? (c.unit ? `1 ${c.unit}` : "1 pack");
  const variants = c.packs?.length
    ? c.packs.map((p) => ({ label: p.label, ...packUnit(p.amount, p.unit), price: Math.round(p.pricePaisa / 100), originalPrice: Math.round(p.mrpPaisa / 100) }))
    : [{ label, amount: 1, unit: c.unit ?? "pack", price, originalPrice: mrp }];
  return {
    id: c.slug,
    name: shortName(c.name),
    image: mediaSrc(c.image),
    price,
    originalPrice: mrp,
    weight: label,
    rating: 0,
    reviews: 0,
    category: shortName(c.categoryName),
    subcategory: shortName(c.subCategoryName),
    variants,
  };
}

export interface ApiFacetCategory { id: string; name: string; slug: string; imageUrl?: string | null; subCategories: { id: string; name: string; slug: string }[] }

const CATEGORY_COLORS = ["#edf6e8", "#fff1e6", "#e8f3fb", "#fdecef", "#f5efe0", "#eef0fb", "#e9f7f2"];

/** A category tile for the home page and the all-categories page (`position` = its place in the whole list, for the tile colour). */
export function categoryToItem(c: { id: string; name: string; slug: string; imageUrl?: string | null; subCategories: unknown[] }, position: number) {
  return { id: c.id, name: shortName(c.name), types: c.subCategories.length, image: mediaSrc(c.imageUrl), color: CATEGORY_COLORS[position % CATEGORY_COLORS.length], href: `/products?category=${encodeURIComponent(c.slug)}` };
}

export interface ApiProductDetail {
  id: string; slug: string; name: string; description: string | null; shortDescription: string | null; unit: string | null; images: string[];
  category: { name: string; slug: string }; subCategory: { name: string; slug: string };
  cutting: { id: string; name: string; chargePaisa: number }[];
  packs: { id: string; label: string; weight: boolean; ratePaisa: number; pricePaisa: number; mrpPaisa: number; discountPercent: number; inStock: boolean; preOrderDays: number | null; availableTo: string | null }[];
  /** weight items are priced per kg; each pack costs rate x weight */
  ratePerKgPaisa: number | null;
  available: boolean; city: ApiCity | null; related: ApiCard[];
  redirectSlug?: string;
}
