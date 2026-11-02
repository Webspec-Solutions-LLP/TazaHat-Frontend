"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import "swiper/css";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "../navbar/Navbar";
import englishText from "./homeHero.english.json";
import bengaliText from "./homeHero.bengali.json";
import hindiText from "./homeHero.hindi.json";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export interface HeroBanner { id: string; image: string; title: string | null; details: string | null; href: string | null }

type Slide = (typeof englishText.banners)[number] & { href?: string | null };

/** Banners set up in the CRM (Sliders) for the city; the designed banners are shown when there are none. */
export default function HomeHero({ items }: { items?: HeroBanner[] }) {
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
      if (stored === "en" || stored === "bn" || stored === "hi") {
        setCurrentLang(stored);
      }
    } catch {
      // Use fallback
    }

    const handleLanguageChange = (event: Event) => {
      const newLang = (event as CustomEvent<SupportedLang>).detail;
      if (newLang && (newLang === "en" || newLang === "bn" || newLang === "hi")) {
        setCurrentLang(newLang);
      }
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const t = textMap[currentLang] || englishText;
  const router = useRouter();
  const startShopping = () => {
    document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();
  };
  const banners = t.banners;
  const slides: Slide[] = items?.length
    ? items.map((b, index) => ({
        image: b.image,
        alt: b.title ?? b.details ?? t.fallbackEyebrow,
        sideImage: banners[index % banners.length].sideImage,
        sideAlt: banners[index % banners.length].sideAlt,
        eyebrow: t.fallbackEyebrow,
        title: b.title ?? b.details ?? t.fallbackTitle,
        description: b.title ? b.details ?? "" : "",
        action: t.fallbackAction,
        href: b.href,
      }))
    : banners;
  const open = (href?: string | null) => {
    if (!href) return startShopping();
    if (/^https?:\/\//.test(href)) window.open(href, "_blank", "noopener");
    else router.push(href);
  };

  return (
    <section className="home-hero" aria-label={t.heroAriaLabel} lang={t.language}>
      <div className="home-content-container">
        <div className="home-banner-grid">
        <Swiper className="home-banner-slider" modules={[A11y, Autoplay, Keyboard]} slidesPerView={1} spaceBetween={0} autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }} keyboard={{ enabled: true, onlyInViewport: true }} rewind a11y={{ containerMessage: t.sliderContainerMessage }}>
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
            <span className="home-banner-promo-kicker">{t.promoKicker}</span>
            <span className="home-banner-promo-title">{t.promoTitle}</span>
            <span className="home-banner-promo-link">{t.promoLink} <b aria-hidden="true">&rarr;</b></span>
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
