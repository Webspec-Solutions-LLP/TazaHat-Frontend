import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeBenefits from "@/components/home/HomeBenefits";
import CityPrompt from "@/components/home/CityPrompt";
import NewsletterSection from "@/components/home/NewsletterSection";
import { AllProductsSection, HeroSection, MiddleSections, TopSections } from "@/components/home/HomeSections";
import OfferLayout1 from "@/components/offerLayout1/OfferLayout1";
import { HeroSkeleton, HomeMiddleSkeleton, HomeTopSkeleton, ProductGridSkeleton } from "@/components/skeleton/Skeletons";
import { readCityCookie } from "@/lib/server/city";
import "./Home.css";

/**
 * Server component. The page appears at once; every part that needs the city's products streams in behind its own skeleton, so
 * the browser never calls the API and the visitor never stares at a blank page.
 */
export default async function Home() {
  const city = await readCityCookie();
  return (
    <>
      {city ? <Suspense fallback={<HeroSkeleton />}><HeroSection cityId={city.id} /></Suspense> : <HomeHero />}
      {!city && <CityPrompt />}
      {city && <Suspense fallback={<HomeTopSkeleton />}><TopSections cityId={city.id} cityName={city.name} /></Suspense>}
      <OfferLayout1 />
      <HomeBenefits />
      {city && <Suspense fallback={<HomeMiddleSkeleton />}><MiddleSections cityId={city.id} /></Suspense>}
      <NewsletterSection />
      {city && <Suspense fallback={<ProductGridSkeleton count={10} label="Loading all products" />}><AllProductsSection cityId={city.id} cityName={city.name} /></Suspense>}
    </>
  );
}
