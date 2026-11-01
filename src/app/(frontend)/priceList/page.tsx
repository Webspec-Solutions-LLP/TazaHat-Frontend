import type { Metadata } from "next";
import { cardToProduct, mediaSrc } from "@/lib/api";
import { getShopCatalog, getShopCategories } from "@/lib/server/api";
import { readCityCookie } from "@/lib/server/city";
import PriceListView, { type PriceGroup } from "./PriceListView";

export const metadata: Metadata = { title: "Price List" };

/** The price list of the visitor's city: every category with the products on sale there and their prices today (read from the shop). */
export default async function PriceListPage() {
  const city = await readCityCookie();
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  if (!city) return <PriceListView cityName={null} groups={[]} today={today} failed={false} />;

  const toRows = (items: Awaited<ReturnType<typeof getShopCatalog>>["items"]) =>
    items.map(cardToProduct).map((p) => ({ id: p.id, name: p.name, image: p.image, price: p.price, originalPrice: p.originalPrice, unit: p.weight }));

  let groups: PriceGroup[] = [];
  let failed = false;
  try {
    const [categories, offers] = await Promise.all([getShopCategories(city.id), getShopCatalog(city.id, { sort: "discount" }, 1, 40)]);
    const perCategory = await Promise.all(categories.slice(0, 16).map((c) => getShopCatalog(city.id, { category: c.slug }, 1, 60)));
    groups = [
      ...(offers.items.length ? [{ id: "offers", name: "Offers", image: null, slug: null, total: offers.total, rows: toRows(offers.items) }] : []),
      ...categories.slice(0, 16).map((c, i) => ({ id: c.slug, name: c.name.split(" (")[0].trim() || c.name, image: c.imageUrl ? mediaSrc(c.imageUrl) : null, slug: c.slug, total: perCategory[i].total, rows: toRows(perCategory[i].items) })),
    ].filter((g) => g.rows.length > 0);
  } catch {
    failed = true;
  }
  return <PriceListView cityName={city.name} groups={groups} today={today} failed={failed} />;
}
