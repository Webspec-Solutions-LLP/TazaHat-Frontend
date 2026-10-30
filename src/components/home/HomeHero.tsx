"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import "swiper/css";

const banners = [
  {
    image: "/images/banner6.webp",
    alt: "Fresh fish and seafood beside the Hooghly River and Howrah Bridge",
    sideImage: "/images/banner2.webp",
    sideAlt: "Fresh fish, seafood, meat, and poultry",
    eyebrow: "Fresh from the river",
    title: "Fresh catch. Better meals.",
    description: "Carefully selected seafood, brought fresh to your kitchen.",
    action: "Shop seafood",
  },
  {
    image: "/images/banner7.webp",
    alt: "Fresh vegetables, fruit, and dairy from the farm",
    sideImage: "/images/banner3.webp",
    sideAlt: "Fresh dairy products including milk, cheese, and yogurt",
    eyebrow: "Good food, every day",
    title: "Bring home the harvest.",
    description: "Farm-fresh produce and everyday essentials, delivered with care.",
    action: "Shop fresh produce",
  },
];

export interface HeroBanner { id: string; image: string; title: string | null; details: string | null; href: string | null }

type Slide = (typeof banners)[number] & { href?: string | null };

/** Banners set up in the CRM (Sliders) for the city; the designed banners are shown when there are none. */
export default function HomeHero({ items }: { items?: HeroBanner[] }) {
  const router = useRouter();
  const startShopping = () => {
    document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();
  };
  const slides: Slide[] = items?.length
    ? items.map((b, index) => ({
        image: b.image,
        alt: b.title ?? b.details ?? "TazaHat offer",
        sideImage: banners[index % banners.length].sideImage,
        sideAlt: banners[index % banners.length].sideAlt,
        eyebrow: "TazaHat offer",
        title: b.title ?? b.details ?? "Fresh every day",
        description: b.title ? b.details ?? "" : "",
        action: "Shop now",
        href: b.href,
      }))
    : banners;
  const open = (href?: string | null) => {
    if (!href) return startShopping();
    if (/^https?:\/\//.test(href)) window.open(href, "_blank", "noopener");
    else router.push(href);
  };

  return (
    <section className="home-hero" aria-label="Fresh food from TazaHaat">
      <div className="home-content-container">
        <div className="home-banner-grid">
        <Swiper className="home-banner-slider" modules={[A11y, Autoplay, Keyboard]} slidesPerView={1} spaceBetween={0} autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }} keyboard={{ enabled: true, onlyInViewport: true }} rewind a11y={{ containerMessage: "Fresh food banners" }}>
          {slides.map((banner, index) => (
            <SwiperSlide key={`${banner.image}-${index}`}>
              <article className="home-main-banner">
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    priority={index === 0}
                    unoptimized={isRemoteImage(banner.image)}
                    onError={fallbackImage}
                    sizes="(max-width: 700px) calc(100vw - 32px), 800px"
                    className="home-banner-image"
                  />
                  <div className="home-banner-main-copy">
                    <p className="home-banner-eyebrow">{banner.eyebrow}</p>
                    <h1>{banner.title}</h1>
                    <p className="home-banner-description">{banner.description}</p>
                    <button className="home-banner-shop" type="button" onClick={() => open(banner.href)}>
                      {banner.action}<span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="home-banner-right-column">
          <button className="home-banner-promo home-banner-promo--reverse" type="button" onClick={startShopping}>
            <span className="home-banner-promo-kicker">Good food, made easy</span>
            <span className="home-banner-promo-title">Fresh picks for your family</span>
            <span className="home-banner-promo-link">Explore the market <b aria-hidden="true">&rarr;</b></span>
          </button>
          <div className="home-banner-side-image">
            <Image src={banners[1].sideImage} alt={banners[1].sideAlt} fill sizes="(max-width: 700px) 50vw, 510px" className="home-banner-image" />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
