import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CityPrompt from "@/components/home/CityPrompt";
import { shortName, type ApiProductDetail } from "@/lib/api";
import { getProductShare, getShopProduct } from "@/lib/server/api";
import { withSavedDressings } from "@/lib/server/saved-dressing";
import { absoluteUrl, getSiteIdentity } from "@/lib/server/site";
import { readCityCookie } from "@/lib/server/city";
import ProductDetailView from "./ProductDetailView";
import "./ProductDetails.css";

/** One fetch per request, shared by the page and its <title>. null = no such product; undefined = the shop could not be reached. */
const loadProduct = cache(async (cityId: string, slug: string): Promise<ApiProductDetail | null | undefined> => {
  try {
    return await withSavedDressings(await getShopProduct(cityId, slug));
  } catch (err) {
    return err instanceof Error && /not found/i.test(err.message) ? null : undefined;
  }
});

// something that looks like a file (favicon.ico, robots.txt ...) is never a product
const looksLikeFile = (slug: string) => /\.[a-z0-9]{2,5}$/i.test(slug);

/** a share-preview picture has to be a real file: a product whose picture is missing on the server shows the shop's logo instead (the "no image" picture) */
async function reachable(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(2500), next: { revalidate: 600 } });
    return r.ok && /^image\//.test(r.headers.get("content-type") ?? "") ? url : null;
  } catch {
    return null;
  }
}

/** The tags a product is shown with in search results and when a link is shared (WhatsApp, Facebook, Telegram, Google ...): no delivery city is needed. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  if (looksLikeFile(slug)) return { title: "TazaHat" };
  const [share, id] = await Promise.all([getProductShare(slug).catch(() => null), getSiteIdentity()]);
  if (!share) return { title: "Product not found", robots: { index: false, follow: false } };
  const name = shortName(share.name);
  const price = share.price ? ` From ₹${Math.round(share.price.lowPaisa / 100)}.` : "";
  const description = `${share.description ? `${share.description}. ` : ""}Buy fresh ${name} online${share.category ? ` (${shortName(share.category.name)})` : ""} and get it delivered by ${id.name}.${price}`.replace(/\.\s*\./g, ".").slice(0, 300);
  const url = `${id.origin}/${encodeURIComponent(share.slug)}`;
  const image = (await reachable(absoluteUrl(id.origin, share.image))) ?? id.logo;
  return {
    title: name, description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: id.name, title: `${name} | ${id.name}`, description, url, images: [{ url: image, alt: share.name }], locale: "en_IN" },
    twitter: { card: "summary_large_image", title: `${name} | ${id.name}`, description, images: [image] },
  };
}

/** The product as structured data (Google shows the price and picture in the result): name, pictures, category, the price range over the cities. */
async function ProductJsonLd({ slug }: { slug: string }) {
  const [share, id] = await Promise.all([getProductShare(slug).catch(() => null), getSiteIdentity()]);
  if (!share) return null;
  const url = `${id.origin}/${encodeURIComponent(share.slug)}`;
  const images = (share.images?.length ? share.images : share.image ? [share.image] : []).map((i) => absoluteUrl(id.origin, i)).filter((x): x is string => !!x);
  const ld: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org", "@type": "Product", name: shortName(share.name), description: share.description || undefined, image: images.length ? images : undefined, sku: share.slug, url,
      brand: { "@type": "Brand", name: id.name }, category: share.category?.name,
      ...(share.price ? { offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: (share.price.lowPaisa / 100).toFixed(2), highPrice: ((share.price.highPaisa ?? share.price.lowPaisa) / 100).toFixed(2), availability: share.price.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url, seller: { "@type": "Organization", name: id.name } } } : {}),
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: id.origin },
      ...(share.category ? [{ "@type": "ListItem", position: 2, name: shortName(share.category.name), item: `${id.origin}/products?category=${share.category.slug}` }] : []),
      { "@type": "ListItem", position: share.category ? 3 : 2, name: shortName(share.name), item: url },
    ] },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />;
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
  return <><ProductJsonLd slug={detail.slug} /><ProductDetailView detail={detail} /></>;
}
