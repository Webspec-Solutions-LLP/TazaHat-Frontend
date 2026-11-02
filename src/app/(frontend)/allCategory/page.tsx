import type { Metadata } from "next";
import "@/components/skeleton/Skeleton.css";
import { categoryToItem } from "@/lib/api";
import { getShopCategoryPage } from "@/lib/server/api";
import { readCityCookie } from "@/lib/server/city";
import AllCategories from "./AllCategories";
import "@/components/category/Category.css";
import "./AllCategory.css";

export const metadata: Metadata = { title: "All categories | TazaHat" };
const PAGE_SIZE = 12;

/** Server component: the first page of the visitor's city categories; the rest load while scrolling. */
export default async function AllCategoryPage() {
  const city = await readCityCookie();
  const first = city ? await getShopCategoryPage(city.id, 1, PAGE_SIZE).catch(() => null) : null;
  return (
    <AllCategories
      hasCity={Boolean(city)}
      initial={first ? first.categories.map((c, i) => categoryToItem(c, i)) : null}
      hasMoreInitially={Boolean(first && first.page * first.limit < first.total)}
    />
  );
}
