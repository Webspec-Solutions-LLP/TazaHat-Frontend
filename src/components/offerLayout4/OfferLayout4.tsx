"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import AddToCart from "../modals/AddToCart/AddToCart";
import Variant from "../modals/variant/Variant";
import type { CartItem } from "../modals/cart/Cart";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "../../lib/wishlist";
import catalog from "../products/english.json";
import text from "./english.json";
import "./OfferLayout4.css";

type CatalogProduct = (typeof catalog.products)[number];
type Deal = (typeof text.deals)[number];

const money = new Intl.NumberFormat(text.locale, {
  style: "currency",
  currency: text.currency,
  maximumFractionDigits: 0,
});

function toCatalogProduct(deal: Deal): CatalogProduct {
  return {
    id: deal.id,
    name: deal.name,
    image: deal.image,
    price: deal.price,
    originalPrice: deal.originalPrice,
    weight: deal.weight,
    rating: deal.rating,
    reviews: deal.reviews,
    category: deal.category,
    subcategory: deal.subcategory,
    variants: deal.variants.map(v => ({
      label: v.label,
      amount: v.amount,
      unit: v.unit,
      price: v.price,
      originalPrice: v.originalPrice,
    })),
  };
}

function CartIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
    </svg>
  );
}

function FlameBadge() {
  return (
    <div className="steal-tab-flame-wrap">
      <svg className="steal-tab-flame-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="stealFlameGrad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff4d4f" />
            <stop offset="50%" stopColor="#ff7a45" />
            <stop offset="100%" stopColor="#ffa940" />
          </linearGradient>
          <linearGradient id="stealFlameInner" x1="16" y1="12" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fffb8f" />
            <stop offset="100%" stopColor="#ffc53d" />
          </linearGradient>
        </defs>
        <path
          d="M16 2C16 2 20 8 20 13C20 14.5 19.5 16 18.5 17C21 16 24 18 24 22C24 26.4183 20.4183 30 16 30C11.5817 30 8 26.4183 8 22C8 17.5 12 12.5 12 9C12 9 14 11 14 13C14 10 16 2 16 2Z"
          fill="url(#stealFlameGrad)"
        />
        <path
          d="M16 16C17.5 17.5 18 19 18 21C18 23.2091 16.2091 25 14 25C13.2 25 12.5 24.6 12 24C11.5 22.5 12 20 14 18C14.5 17.5 15.5 16.5 16 16Z"
          fill="url(#stealFlameInner)"
        />
      </svg>
      <span className="steal-tab-hot-tag">HOT ITEM</span>
    </div>
  );
}

export default function OfferLayout4() {
  const [activeTabId, setActiveTabId] = useState<string>(text.tabs[0]?.id ?? "trending");
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [variantProduct, setVariantProduct] = useState<CatalogProduct | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const previousTabId = useRef(activeTabId);

  useEffect(() => {
    const refreshWishlist = () => setSaved(readWishlistIds());
    refreshWishlist();
    return subscribeToWishlist(refreshWishlist);
  }, []);

  const filteredDeals = useMemo(() => {
    const tab = text.tabs.find(t => t.id === activeTabId);
    if (!tab || tab.id === "trending") {
      return text.deals;
    }
    if (tab.maxPrice !== undefined) {
      return text.deals.filter(deal => deal.price === tab.maxPrice);
    }
    return text.deals.filter(deal => deal.tag === tab.id);
  }, [activeTabId]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed || previousTabId.current === activeTabId) return;

    previousTabId.current = activeTabId;
    swiper.slideTo(0, 450);
  }, [activeTabId, filteredDeals.length]);

  const handleTabChange = (tabId: string) => setActiveTabId(tabId);

  const renderProduct = (product: Deal, index: number) => {
    const cardProduct = toCatalogProduct(product);
    const isSaved = saved.includes(cardProduct.id);
    const variants = cardProduct.variants?.length ? cardProduct.variants : [{ label: cardProduct.weight, amount: 1, unit: "pack", price: cardProduct.price, originalPrice: cardProduct.originalPrice }];
    const initialVariant = Math.max(0, variants.findIndex(variant => variant.price === cardProduct.price));
    const selectedIndex = variantIndexes[cardProduct.id] ?? initialVariant;
    const variant = variants[selectedIndex] ?? variants[0];
    const discount =
      variant.originalPrice > 0
        ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100))
        : 0;
    const description =
      product.description ||
      `${product.name} selected for freshness and quality, ready for your everyday meals.`;

    return (
      <article
        className="product-card"
        key={product.id}
        style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
      >
        <div className="product-image">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 600px) 45vw, (max-width: 1023px) 25vw, 180px"
            draggable={false}
          />
          <span className="product-discount-badge">
            {text.discount.replace("{percent}", String(discount))}
          </span>
          <span
            className="product-image-rating"
            aria-label={text.rating
              .replace("{rating}", String(product.rating))
              .replace("{reviews}", String(product.reviews))}
          >
            ★ {product.rating}
          </span>
          <button
            type="button"
            className="product-save"
            aria-pressed={isSaved}
            aria-label={(isSaved ? text.unsave : text.save).replace("{name}", product.name)}
            onClick={() =>
              setSaved(toggleWishlistId(cardProduct.id))
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
        </div>
        <h3><Link href={`/productDetails?id=${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
        <p className="product-description" title={description}>
          {description}
        </p>
        <div className="product-pricing">
          <strong>{money.format(variant.price)}</strong>
          <del>{money.format(variant.originalPrice)}</del>
        </div>
        <div className="product-variant-wrap">
          <button type="button" className="product-variant-trigger" aria-haspopup="listbox" aria-expanded={openVariant === cardProduct.id} onClick={() => setOpenVariant(current => current === cardProduct.id ? null : cardProduct.id)}>
            <span>{variant.label}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
          </button>
          {openVariant === cardProduct.id && <div className="product-variant-menu" role="listbox" aria-label={`Choose size for ${product.name}`}>
            {variants.map((option, optionIndex) => <button type="button" role="option" aria-selected={optionIndex === selectedIndex} key={`${cardProduct.id}-${option.label}`} onClick={() => { setVariantIndexes(current => ({ ...current, [cardProduct.id]: optionIndex })); setOpenVariant(null); }}><span>{option.label}</span><span>{money.format(option.price)}</span></button>)}
          </div>}
        </div>
        <div className="product-card-actions">
          <button className="product-details-button" type="button" onClick={() => setVariantProduct(cardProduct)}><CartIcon />{text.addToCart}</button>
          <button className="product-quick-view" type="button" aria-label={`View ${product.name} details`} onClick={() => setSelected(cardProduct)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </article>
    );
  };

  return (
    <section className="offer-layout-4" lang={text.language} aria-labelledby="steal-deals-heading">
      <div className="offer-layout-4-container">
        {/* Header Top: Title + Navigation buttons */}
        <div className="steal-deals-header-top">
          <h2 id="steal-deals-heading" className="steal-deals-title">
            {text.heading}
          </h2>
        </div>

        {/* Store Tabs Bar */}
        <div className="steal-tabs-bar" role="tablist" aria-label="Steal deals categories">
          {text.tabs.map(tab => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`steal-tab-item ${isActive ? "steal-tab--active" : ""}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.type === "trending" ? (
                  <>
                    <FlameBadge />
                    <span className="steal-tab-label">{tab.label}</span>
                  </>
                ) : (
                  <>
                    <span className="steal-tab-price">{tab.priceTag}</span>
                    <span className="steal-tab-sublabel">{tab.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Swiper Slider - 5.6 slides per view on desktop (1320px container) */}
        <div id="steal-deals-slider-wrap">
          <Swiper
            className="products-slider"
            modules={[A11y]}
            onSwiper={swiper => {
              swiperRef.current = swiper;
            }}
            slidesPerView={2.1}
            spaceBetween={8}
            breakpoints={{
              451: { slidesPerView: 2.5, spaceBetween: 8 },
              576: { slidesPerView: 2.9, spaceBetween: 9 },
              679: { slidesPerView: 3.1, spaceBetween: 10 },
              877: { slidesPerView: 4.5, spaceBetween: 12 },
              1300: { slidesPerView: 5.5, spaceBetween: 12 },
            }}
            a11y={{
              containerMessage: text.sliderLabel,
              slideLabelMessage: text.slideLabel,
            }}
            tabIndex={0}
          >
            {filteredDeals.map((deal, index) => (
              <SwiperSlide key={deal.id}>
                {renderProduct(deal, index)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Add To Cart Modal */}
      {selected && (
        <AddToCart
          key={selected.id}
          product={selected}
          locale={text.locale}
          currency={text.currency}
          saved={saved.includes(selected.id)}
          onToggleWishlist={() => setSaved(toggleWishlistId(selected.id))}
          onClose={() => setSelected(null)}
          onOpenProduct={setSelected}
        />
      )}
      {variantProduct && (
        <Variant
          product={variantProduct}
          currency={text.currency}
          onClose={() => setVariantProduct(null)}
          onGoToCart={(item: CartItem) => {
            window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
            setVariantProduct(null);
          }}
        />
      )}
    </section>
  );
}
