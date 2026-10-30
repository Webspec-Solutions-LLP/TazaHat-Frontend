import AllProducts from "@/components/home/AllProducts";
import HomeHero, { type HeroBanner } from "@/components/home/HomeHero";
import ReloadButton from "@/components/home/ReloadButton";
import Category, { type CategoryTile } from "@/components/category/Category";
import Products from "@/components/products/Products";
import TodalDeals from "@/components/todayDeals/TodalDeals";
import OfferLayout2, { type FreshPick } from "@/components/offerLayout2/OfferLayout2";
import OfferLayout3 from "@/components/offerLayout3/OfferLayout3";
import OfferLayout4, { type StealTab } from "@/components/offerLayout4/OfferLayout4";
import BestSeller, { type BestSellerGroup } from "@/components/bestSeller/BestSeller";
import { cardToProduct, categoryToItem, mediaSrc, shortName, type ApiCard, type Product } from "@/lib/api";
import { loadFirstPage, loadHome } from "@/lib/server/home";

/**
 * The data-driven parts of the home page. Each one is a server component that waits for the city's data, so the page can show
 * its skeleton in that spot (<Suspense fallback>) and fill it in as soon as the data is there. All of them share one request
 * (loadHome is cached).
 */

const FRESH_THEMES = ["green", "yellow", "orange", "red"];
const STEAL_TABS: StealTab[] = [
  { id: "trending", label: "Trending", type: "trending", badge: "HOT ITEM" },
  { id: "store-99", priceTag: "₹99", label: "Store", type: "price", maxPrice: 99 },
  { id: "store-199", priceTag: "₹199", label: "Store", type: "price", maxPrice: 199 },
  { id: "store-499", priceTag: "₹499", label: "Store", type: "price", maxPrice: 499 },
];

type City = { cityId: string; cityName: string };

/** Banners set up in the CRM for the city (the designed banners when there are none). */
export async function HeroSection({ cityId }: Pick<City, "cityId">) {
  const home = await loadHome(cityId);
  const banners: HeroBanner[] = "data" in home ? home.data.banners.filter((b) => b.image).map((b) => ({ id: b.id, image: mediaSrc(b.image), title: b.title, details: b.details, href: b.href })) : [];
  return <HomeHero items={banners} />;
}

/** Today's deals, categories and the "fresh in your city" shelf (plus the message when there is nothing on sale or the shop is unreachable). */
export async function TopSections({ cityId, cityName }: City) {
  const home = await loadHome(cityId);
  if ("error" in home) return <p className="home-city-status home-city-status--error" role="alert">{home.error} <ReloadButton /></p>;
  const { data } = home;
  const deals = (data.special.length ? data.special : data.offers.items).map(cardToProduct);
  const fresh = data.latest.map(cardToProduct);
  const categories: CategoryTile[] = data.categories.map(categoryToItem);
  return (
    <>
      {deals.length === 0 && fresh.length === 0 && <p className="home-city-status">No products are on sale in {cityName} right now. Please check back soon.</p>}
      {deals.length > 0 && <TodalDeals products={deals} />}
      {categories.length > 0 && <Category items={categories} />}
      {fresh.length > 0 && <Products products={fresh} heading={`Fresh in ${cityName}`} />}
    </>
  );
}

/** Best sellers and the offer sections. */
export async function MiddleSections({ cityId }: Pick<City, "cityId">) {
  const home = await loadHome(cityId);
  if ("error" in home) return null;
  const { data } = home;
  const bestSellerGroups: BestSellerGroup[] = data.bestSellerGroups.map((g) => ({ id: g.id, name: shortName(g.name), slug: g.slug, more: g.more, images: g.images.map((src) => ({ src: mediaSrc(src), alt: shortName(g.name) })) }));
  const freshPicks: FreshPick[] = data.categoryDiscounts.map((c, index) => ({ id: c.id, name: shortName(c.name), image: mediaSrc(c.imageUrl), discount: c.maxDiscount, theme: FRESH_THEMES[index % FRESH_THEMES.length], slug: c.slug }));
  // when today's special prices already fill the first deals row, this shelf shows the biggest discounts; otherwise the best sellers
  const dealShelf: Product[] = (data.special.length ? data.offers.items : data.bestSellers).slice(0, 8).map(cardToProduct);
  // "steal deals": one pool of this city's products, filtered by price tabs
  const seen = new Set<string>();
  const pool: ApiCard[] = [...data.bestSellers, ...data.latest, ...data.offers.items, ...data.sections.flatMap((x) => x.products)];
  const stealPool: Product[] = pool.filter((c) => c.pricePaisa !== null && !seen.has(c.slug) && !!seen.add(c.slug)).map(cardToProduct);
  return (
    <>
      {bestSellerGroups.length > 0 && <BestSeller groups={bestSellerGroups} />}
      {freshPicks.length > 0 && <OfferLayout2 items={freshPicks} />}
      {dealShelf.length > 0 && <OfferLayout3 products={dealShelf} />}
      {stealPool.length > 0 && <OfferLayout4 products={stealPool} tabs={STEAL_TABS} />}
    </>
  );
}

/** The "all products" list at the bottom (the first 10 here, the rest while scrolling). */
export async function AllProductsSection({ cityId, cityName }: City) {
  const firstPage = await loadFirstPage(cityId);
  if (!firstPage || firstPage.items.length === 0) return null;
  return <AllProducts initial={firstPage.items.map(cardToProduct)} total={firstPage.total} cityName={cityName} />;
}
