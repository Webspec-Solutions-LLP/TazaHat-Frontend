import type { Metadata } from "next";
import Link from "next/link";
import CityPrompt from "@/components/home/CityPrompt";
import english from "@/components/category/english.json";
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
    <main className="all-category-page category-section" lang={english.language}>
      <div className="category-container">
        <header className="category-header">
          <div>
            <h1>{english.heading}</h1>
            <p>{english.description}</p>
          </div>
          <Link className="category-view-all" href="/">Back to Home</Link>
        </header>
        {!city ? <CityPrompt /> : !first ? <p className="home-city-status home-city-status--error" role="alert">We could not load the categories right now. Please try again.</p>
          : <AllCategories initial={first.categories.map((c, i) => categoryToItem(c, i))} hasMoreInitially={first.page * first.limit < first.total} />}
      </div>
    </main>
  );
}
