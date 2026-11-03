import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/server/api";
import { siteOrigin } from "@/lib/server/site";

export const revalidate = 3600;

/** sitemap.xml: the home page, the shop pages, every category and sub-category, every product and the legal documents. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const d = await getSitemapData();
  const now = new Date();
  const page = (path: string, priority: number, freq: MetadataRoute.Sitemap[number]["changeFrequency"], lastModified: Date = now) => ({ url: `${origin}${path}`, lastModified, changeFrequency: freq, priority });
  return [
    page("/", 1, "daily"),
    page("/products", 0.9, "daily"),
    page("/allCategory", 0.8, "weekly"),
    page("/priceList", 0.7, "daily"),
    page("/deliveryService", 0.5, "monthly"),
    page("/aboutUs", 0.4, "monthly"),
    page("/contactUs", 0.4, "monthly"),
    ...d.categories.flatMap((c) => [page(`/products?category=${encodeURIComponent(c.slug)}`, 0.7, "daily"), ...c.subs.map((s) => page(`/products?category=${encodeURIComponent(c.slug)}&sub=${encodeURIComponent(s)}`, 0.6, "daily"))]),
    ...d.products.map((p) => page(`/${encodeURIComponent(p.slug)}`, 0.8, "daily", new Date(p.updatedAt))),
    ...d.legal.map((l) => page(`/legal/${encodeURIComponent(l.slug)}`, 0.3, "yearly", new Date(l.updatedAt))),
  ];
}
