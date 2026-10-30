import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CityPrompt from "@/components/home/CityPrompt";
import { shortName, type ApiProductDetail } from "@/lib/api";
import { getShopProduct } from "@/lib/server/api";
import { readCityCookie } from "@/lib/server/city";
import ProductDetailView from "./ProductDetailView";
import "./ProductDetails.css";

/** One fetch per request, shared by the page and its <title>. null = no such product; undefined = the shop could not be reached. */
const loadProduct = cache(async (cityId: string, slug: string): Promise<ApiProductDetail | null | undefined> => {
  try {
    return await getShopProduct(cityId, slug);
  } catch (err) {
    return err instanceof Error && /not found/i.test(err.message) ? null : undefined;
  }
});

// something that looks like a file (favicon.ico, robots.txt ...) is never a product
const looksLikeFile = (slug: string) => /\.[a-z0-9]{2,5}$/i.test(slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await readCityCookie();
  if (!city || looksLikeFile(slug)) return { title: "TazaHat" };
  const detail = await loadProduct(city.id, slug);
  return { title: detail ? `${shortName(detail.name)} | TazaHat` : "TazaHat" };
}

/** A product page: tazahat.in/<product-slug>. Fetched on the server for the visitor's city. */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  if (looksLikeFile(slug)) notFound();
  const city = await readCityCookie();
  if (!city) return <main className="product-details-page"><CityPrompt /></main>;

  const detail = await loadProduct(city.id, slug);
  if (detail === null) notFound();
  if (detail === undefined) return <main className="product-details-page"><p className="home-city-status home-city-status--error" role="alert">We could not load this product right now. Please try again.</p></main>;
  // the product was renamed: its old address leads to the new one
  if (detail.redirectSlug) permanentRedirect(`/${encodeURIComponent(detail.redirectSlug)}`);
  return <ProductDetailView detail={detail} />;
}
