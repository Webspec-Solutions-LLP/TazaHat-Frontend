"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import text from "./english.json";
import catalog from "../products/english.json";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "../../lib/wishlist";
import AddToCart from "../modals/AddToCart/AddToCart";
import Variant from "../modals/variant/Variant";
import type { CartItem } from "../modals/cart/Cart";
import "./TodayDeals.css";

type Product = (typeof catalog.products)[number];
const money = new Intl.NumberFormat(text.locale, { style: "currency", currency: text.currency, maximumFractionDigits: 0 });

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export default function TodalDeals() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [navbarOffset, setNavbarOffset] = useState(72);
  const dealsSection = useRef<HTMLElement>(null);
  useEffect(() => {
    // Demo offer ends at the next midnight in India; use the catalog deadline when available.
    const offset = 330 * 60 * 1000;
    const deadline = Math.floor((Date.now() + offset) / 86400000) * 86400000 + 86400000 - offset;
    const tick = () => setRemaining(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let frame = 0;
    const updateFloatingTimer = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const section = dealsSection.current;
        if (!section) return;
        const navbarBottom = document.querySelector(".tazahat-navbar")?.getBoundingClientRect().bottom ?? 72;
        setNavbarOffset(navbarBottom);
        setShowFloatingTimer(section.getBoundingClientRect().bottom <= navbarBottom);
      });
    };
    updateFloatingTimer();
    window.addEventListener("scroll", updateFloatingTimer, { passive: true });
    window.addEventListener("resize", updateFloatingTimer);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateFloatingTimer);
      window.removeEventListener("resize", updateFloatingTimer);
    };
  }, []);
  const clock = [
    { label: text.days, value: remaining === null ? null : Math.floor(remaining / 86400) },
    { label: text.hours, value: remaining === null ? null : Math.floor(remaining / 3600) % 24 },
    { label: text.minutes, value: remaining === null ? null : Math.floor(remaining / 60) % 60 },
    { label: text.seconds, value: remaining === null ? null : remaining % 60 },
  ];
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  useEffect(() => {
    const refreshWishlist = () => setSaved(readWishlistIds());
    refreshWishlist();
    return subscribeToWishlist(refreshWishlist);
  }, []);

  const renderProduct = (product: Product) => {
    const isSaved = saved.includes(product.id);
    const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
    const initialVariant = Math.max(0, variants.findIndex(variant => variant.price === product.price));
    const selectedIndex = variantIndexes[product.id] ?? initialVariant;
    const variant = variants[selectedIndex] ?? variants[0];
    const discount = variant.originalPrice > 0 ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100)) : 0;
    const description = `${product.name} selected for freshness and quality, ready for your everyday meals.`;
    return (
      <article className="product-card" key={product.id}>
        <div className="product-image">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 1023px) 25vw, 180px" draggable={false} />
          <span className="product-discount-badge">{text.discount.replace("{percent}", String(discount))}</span>
          <span className="product-image-rating" aria-label={text.rating.replace("{rating}", String(product.rating)).replace("{reviews}", String(product.reviews))}>★ {product.rating}</span>
          <button type="button" className="product-save" aria-pressed={isSaved} aria-label={(isSaved ? text.unsave : text.save).replace("{name}", product.name)} onClick={() => setSaved(toggleWishlistId(product.id))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          </button>
        </div>
        <h3><Link href={`/productDetails?id=${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
        <p className="product-description" title={description}>{description}</p>
        <div className="product-pricing"><strong>{money.format(variant.price)}</strong><del>{money.format(variant.originalPrice)}</del></div>
        <div className="product-variant-wrap">
          <button type="button" className="product-variant-trigger" aria-haspopup="listbox" aria-expanded={openVariant === product.id} onClick={() => setOpenVariant(current => current === product.id ? null : product.id)}>
            <span>{variant.label}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
          </button>
          {openVariant === product.id && <div className="product-variant-menu" role="listbox" aria-label={`Choose size for ${product.name}`}>
            {variants.map((option, index) => <button type="button" role="option" aria-selected={index === selectedIndex} key={`${product.id}-${option.label}`} onClick={() => { setVariantIndexes(current => ({ ...current, [product.id]: index })); setOpenVariant(null); }}><span>{option.label}</span><span>{money.format(option.price)}</span></button>)}
          </div>}
        </div>
        <div className="product-card-actions">
          <button className="product-details-button" type="button" onClick={() => setVariantProduct(product)}><CartIcon />Add to Cart</button>
          <button className="product-quick-view" type="button" aria-label={`View ${product.name} details`} onClick={() => setSelected(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </article>
    );
  };

  return (
    <section ref={dealsSection} id="today-deals" className="products-section today-deals-section" aria-labelledby="deals-heading" lang={text.language}>
      <div className="products-container today-deals-panel">
        <div className="products-header deals-header">
          <div className="deals-title"><svg viewBox="0 0 24 32" fill="currentColor" aria-hidden="true"><path d="M14 1 2 18h9l-2 13 13-19h-9l3-11Z" /></svg><div><h2 id="deals-heading">{text.heading}</h2><p>{text.description}</p></div></div>
          <div className="deals-countdown" role="timer" aria-label={text.offerEnds}><span>{text.offerEnds}</span><div className="deals-clock">{clock.map(unit => <div className="deals-time" key={unit.label}><strong>{unit.value === null ? "--" : String(unit.value).padStart(2, "0")}</strong><span>{unit.label}</span></div>)}</div></div>
        </div>
        <div id="deals-list">
          <Swiper className="products-slider" modules={[A11y, Keyboard, Mousewheel]} slidesPerView={1.7} spaceBetween={8} breakpoints={{ 451: { slidesPerView: 2.1, spaceBetween: 9 }, 576: { slidesPerView: 2.7, spaceBetween: 10 }, 679: { slidesPerView: 3.5, spaceBetween: 10 }, 877: { slidesPerView: 4.5, spaceBetween: 12 }, 1300: { slidesPerView: 5.5, spaceBetween: 12 } }} keyboard={{ enabled: true, onlyInViewport: true }} mousewheel={{ forceToAxis: true }} a11y={{ containerMessage: text.sliderLabel, slideLabelMessage: text.columnLabel }} tabIndex={0}>
            {catalog.products.map(product => <SwiperSlide key={product.id}>{renderProduct(product)}</SwiperSlide>)}
          </Swiper>
        </div>
      </div>
      {showFloatingTimer && (
        <button
          type="button"
          className="deals-floating-timer"
          style={{ top: navbarOffset }}
          aria-label="Return to today's deals"
          onClick={() => dealsSection.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <span className="deals-floating-label"><strong>Today&apos;s Deal</strong><small>{text.offerEnds}</small></span>
          <span className="deals-floating-clock">
            {clock.map(unit => <span className="deals-floating-time" key={unit.label}>
              <strong>{unit.value === null ? "--" : String(unit.value).padStart(2, "0")}</strong>
              <small>{unit.label}</small>
            </span>)}
          </span>
          <span className="deals-floating-cta">Shop deals <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" /></svg></span>
        </button>
      )}
      {selected && <AddToCart key={selected.id} product={selected} locale={catalog.locale} currency={catalog.currency} saved={saved.includes(selected.id)} onToggleWishlist={() => setSaved(toggleWishlistId(selected.id))} onClose={() => setSelected(null)} onOpenProduct={setSelected} />}
      {variantProduct && <Variant product={variantProduct} currency={catalog.currency} onClose={() => setVariantProduct(null)} onGoToCart={(item: CartItem) => {
        window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
        setVariantProduct(null);
      }} />}
    </section>
  );
}
