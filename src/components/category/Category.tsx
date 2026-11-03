"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import "./Category.css";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import { fallbackImage, isRemoteImage } from "@/lib/api";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export type CategoryTile = { id: string; name: string; types: number; image: string; color: string; href?: string };
/** old name of the type */
export type CategoryItem = CategoryTile;

/** How many categories the home page shows before it offers "View All Categories". */
export const HOME_CATEGORY_LIMIT = 7;

function getCategoryCardStyle(category: CategoryTile): CSSProperties & { "--category-shadow-color": string } {
  return {
    backgroundColor: category.color,
    "--category-shadow-color": category.color,
  };
}

function renderCard(category: CategoryTile, text: typeof englishText) {
  return (
    <>
      <div className="category-image">
        <Image
          src={isRemoteImage(category.image) ? category.image : `${category.image}?v=transparent-2`}
          unoptimized
          onError={fallbackImage}
          draggable={false}
          alt={category.name}
          fill
          sizes="(max-width: 600px) 42vw, (max-width: 1023px) 26vw, 190px"
        />
      </div>
      <div className="category-details">
        <h3>{category.name}</h3>
        <p className="category-count"><strong>{category.types}</strong> {category.types === 1 ? text.productType : text.productTypes}</p>
        <span className="category-arrow" aria-hidden="true">→</span>
      </div>
    </>
  );
}

/**
 * Shop by Category. Up to 7 categories: on a desktop they sit in one row, centred. More than 7: the first 7 and a "View All
 * Categories" link to the full list. Phones and tablets get the swipeable row.
 */
export default function Category({ items }: { items?: CategoryTile[] }) {
  const [language] = useLanguage();
  const text = textMap[language];
  const categories = items ?? text.categories;
  const shown = categories.slice(0, HOME_CATEGORY_LIMIT);
  const hasMore = categories.length > HOME_CATEGORY_LIMIT;
  const link = (category: CategoryTile) => category.href ?? `/products?category=${encodeURIComponent(category.name)}`;
  return (
    <section className="category-section" aria-labelledby="category-title" lang={text.language}>
      <div className="category-container">
        <div className="category-header">
          <div>
            <h2 id="category-title">{text.heading}</h2>
            <p>{text.description}</p>
          </div>
          {hasMore && <Link className="category-view-all" href="/allCategory">{text.viewAll}</Link>}
        </div>
        <div id="category-list">
          {/* desktop: one centred row */}
          <ul className="category-desktop-row" aria-label={text.heading}>
            {shown.map((category) => (
              <li key={category.id}>
                <Link className="category-card category-card--pill" href={link(category)} style={getCategoryCardStyle(category)}>{renderCard(category, text)}</Link>
              </li>
            ))}
          </ul>
          {/* phone / tablet: swipe */}
          <Swiper
            className="category-slider category-mobile-slider"
            modules={[A11y, Keyboard, Mousewheel]}
            slidesPerView={2.3}
            spaceBetween={8}
            breakpoints={{ 451: { slidesPerView: 3.1, spaceBetween: 8 }, 576: { slidesPerView: 3.8, spaceBetween: 9 }, 679: { slidesPerView: 4.5, spaceBetween: 9 }, 877: { slidesPerView: 5.6, spaceBetween: 10 } }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            mousewheel={{ forceToAxis: true }}
            a11y={text.sliderAccessibility}
            tabIndex={0}
          >
            {shown.map((category) => (
              <SwiperSlide key={category.id}>
                <Link className="category-card category-card--pill" href={link(category)} style={getCategoryCardStyle(category)}>{renderCard(category, text)}</Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
