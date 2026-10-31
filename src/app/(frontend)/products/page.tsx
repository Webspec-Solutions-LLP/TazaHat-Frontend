import type { Metadata } from "next";
import CityPrompt from "@/components/home/CityPrompt";
import { cardToProduct } from "@/lib/api";
import { getShopCatalog, getShopCategories } from "@/lib/server/api";
import { readCityCookie } from "@/lib/server/city";
import ProductsCatalog, { type CatalogQueryProps } from "./ProductsCatalog";

export const metadata: Metadata = { title: "Products | TazaHat" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Server component: filters come from the address bar, products for the visitor's city are fetched here (20 per page). */
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const city = await readCityCookie();
  if (!city) return <main className="products-section catalog-page"><CityPrompt /></main>;

  const query: CatalogQueryProps = { category: first(sp.category), sub: first(sp.sub), q: first(sp.q), sort: first(sp.sort), maxPrice: first(sp.maxPrice) };
  const [firstPage, categories] = await Promise.all([
    getShopCatalog(city.id, query, 1, 20).catch(() => null),
    getShopCategories(city.id).catch(() => []),
  ]);
  if (!firstPage) return <main className="products-section catalog-page"><p className="home-city-status home-city-status--error" role="alert">We could not load products right now. Please try again.</p></main>;
  return <ProductsCatalog key={JSON.stringify(query)} initial={firstPage.items.map(cardToProduct)} total={firstPage.total} categories={categories} query={query} cityName={city.name} />;
}
