"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import textRaw from "./english.json";
import CityPrompt from "@/components/home/CityPrompt";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import "./PriceList.css";
import { brandify } from "@/lib/brandText";
const text = brandify(textRaw);

/** One product line of the price list (a product of the shop, as it is sold in the chosen city). */
export interface PriceRow { id: string; name: string; image: string; price: number; originalPrice: number; unit: string }
/** A category (or "Offers") with its products; `total` is how many the category has in all, `slug` its address on the products page. */
export interface PriceGroup { id: string; name: string; image: string | null; slug: string | null; total: number; rows: PriceRow[] }

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: text.currency, maximumFractionDigits: 0 });

function Icon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "fish" ? <><path d="M3 12C8 2 17 5 20 12c-3 7-12 10-17 0Zm0 0-2-4v8l2-4Z" /><circle cx="16" cy="11" r=".8" /><path d="m9 6 3-3 3 3M9 18l3 3 3-3" /></> : kind === "leaf" ? <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8" /></> : kind === "cut" ? <path d="m3 21 7-7M9 15l-3-3L17 2c5 2 5 5 2 8l-6 6-4-1Z" /> : kind === "snow" ? <><path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3" /></> : kind === "percent" ? <><path d="m5 20 14-16" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /></> : kind === "cart" ? <><path d="M2 3h3l3 13h11l3-9H6" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></> : <><path d="m12 2 10 5v10l-10 5-10-5V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5" /></>}
  </svg>;
}

export default function PriceListView({ cityName, groups, today, failed }: { cityName: string | null; groups: PriceGroup[]; today: string; failed: boolean }) {
  const [category, setCategory] = useState(groups[0]?.id ?? "");
  function scrollToCategory(id: string) {
    setCategory(id);
    document.getElementById(`price-category-${id}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }
  return (
    <main className="price-page" lang={text.language}>
      <section className="price-hero" style={{ backgroundImage: `url("${text.heroImage}")` }} aria-labelledby="price-hero-title">
        <div className="price-container price-hero-inner">
          <div className="price-hero-copy">
            <p className="price-region">{cityName ?? text.region}</p>
            <h1 id="price-hero-title">{text.heroTitle} <span>{text.heroHighlight}</span></h1>
            <ul className="price-hero-benefits">{text.benefits.map(benefit => <li key={benefit.label}><Icon kind={benefit.icon} /><span>{benefit.label}</span></li>)}</ul>
          </div>
          <p className="price-hero-tagline">{text.tagline}</p>
          <div className="price-hero-seal"><strong>{text.offerTitle}</strong><span>{text.offerText}</span></div>
        </div>
      </section>
      <div className="price-action-strip">
        <div className="price-container price-actions">
          <div className="price-app-social">
            <div className="price-app"><Image src={text.playstoreImage} alt={text.appLabel} width={165} height={50} /></div>
            <nav className="price-socials" aria-label={text.socialLabel}>
              {text.socials.map(social => <a key={social.id} className={`price-social price-social--${social.id}`} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.name}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {social.id === "instagram" ? <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></> : social.id === "facebook" ? <path fill="currentColor" stroke="none" d="M14 22v-9h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A23 23 0 0 0 15 1c-3 0-5 2-5 5v3H7v4h3v9Z" /> : <><path d="M21 11.5a9 9 0 0 1-13.3 8L3 21l1.5-4.5A9 9 0 1 1 21 11.5Z" /><path d="M8 7c-2 2 3 8 6 9 1 0 3-2 2-3l-2-1-1 1-3-3 1-1-1-2Z" /></>}
                </svg>
              </a>)}
            </nav>
          </div>
          <a href="#price-products" className="price-order-main"><Icon kind="cart" />{text.orderNow}<span aria-hidden="true">→</span></a>
          <p className="price-action-note">{text.appNote}</p>
        </div>
      </div>
      <section className="price-container price-catalog" id="price-products" aria-labelledby="price-list-heading">
        <header className="price-list-header"><h2 id="price-list-heading">{cityName ? `${text.brand} ${cityName}` : text.brand} <span>{text.headingHighlight}</span></h2>{cityName && <p><strong className="price-period-label">Prices as on</strong><span className="price-period-dates"><time dateTime={today}>{today}</time></span></p>}</header>
        {cityName && <p className="price-demo-note">These are today&apos;s prices in {cityName}. They can change, and the price shown when you order is the one that counts.</p>}
        {!cityName && <CityPrompt />}
        {cityName && failed && <p className="price-empty" role="alert">We could not load the price list. Please try again in a moment.</p>}
        <Swiper
          className="price-tabs"
          modules={[A11y, Keyboard, Mousewheel]}
          slidesPerView={2.6}
          spaceBetween={8}
          breakpoints={{ 576: { slidesPerView: 3.5, spaceBetween: 10 }, 876: { slidesPerView: 5.2, spaceBetween: 10 }, 1100: { slidesPerView: 7.2, spaceBetween: 10 } }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          mousewheel={{ forceToAxis: true }}
          a11y={{ containerMessage: text.headingHighlight, slideLabelMessage: "Category {{index}} of {{slidesLength}}" }}
          tabIndex={0}
        >
          {groups.map(item => (
            <SwiperSlide key={item.id}>
              <button type="button" aria-pressed={category === item.id} aria-controls={`price-category-${item.id}`} onClick={() => scrollToCategory(item.id)}>
                {item.image ? <Image src={item.image} alt="" width={36} height={36} unoptimized={isRemoteImage(item.image)} onError={fallbackImage} className="price-category-image" /> : <Icon kind="percent" />}
                <span>{item.name}</span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
        {groups.map(group => (
          <section key={group.id} id={`price-category-${group.id}`} className="price-category-section" aria-labelledby={`price-category-heading-${group.id}`}>
            <h2 id={`price-category-heading-${group.id}`} className="price-category-heading">{group.name}</h2>
            <ol className="price-products">{group.rows.map((product, index) => <li key={product.id} className="price-product"><div className="price-product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 100px, 190px" unoptimized={isRemoteImage(product.image)} onError={fallbackImage} /></div><div className="price-product-copy"><h3><Link href={`/${encodeURIComponent(product.id)}`}>{index + 1}. {product.name}</Link></h3><div className="price-product-cost"><strong>{money.format(product.price)}<span>{text.perUnit.replace("{unit}", product.unit)}</span></strong>{product.originalPrice > product.price && <><del>{money.format(product.originalPrice)}</del><span className="price-discount">{Math.round((1 - product.price / product.originalPrice) * 100)}% {text.off}</span></>}</div></div><Link className="price-product-order" href={`/${encodeURIComponent(product.id)}`}><Icon kind="cart" />{text.orderNow}</Link></li>)}</ol>
            {group.slug && group.total > group.rows.length && <p className="price-more"><Link href={`/products?category=${encodeURIComponent(group.slug)}`}>See all {group.total} products in {group.name} →</Link></p>}
            {!group.rows.length && <p className="price-empty">{text.empty}</p>}
          </section>
        ))}
      </section>
      </main>
  );
}
