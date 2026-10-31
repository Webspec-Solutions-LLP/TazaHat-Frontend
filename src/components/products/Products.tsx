"use client";

import { useCallback, useEffect, useState } from "react";
import AddToCart from "../modals/AddToCart/AddToCart";
import Variant from "../modals/variant/Variant";
import type { CartItem } from "../modals/cart/Cart";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import text from "./english.json";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "../../lib/wishlist";
import { fallbackImage, isRemoteImage } from "../../lib/api";
import "./Products.css";
import VariantChips from "@/components/products/VariantChips";

type Product = (typeof text.products)[number];
const money = new Intl.NumberFormat(text.locale, { style: "currency", currency: text.currency, maximumFractionDigits: 0 });
interface ProductsProps {
  heading?: string;
  products?: Product[];
  showViewAll?: boolean;
  layout?: "catalog" | "related" | "grid";
}

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export default function Products({ heading, products = text.products, showViewAll = true, layout = "catalog" }: ProductsProps) {
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const closeDetails = useCallback(() => setSelected(null), []);
  useEffect(() => {
    const refreshWishlist = () => setSaved(readWishlistIds());
    refreshWishlist();
    return subscribeToWishlist(refreshWishlist);
  }, []);
  const sectionHeading = heading ?? text.heading;
  const productsPerSlide = layout === "related" && products.length <= 10 ? 1 : 2;
  const columns = Array.from(
    { length: Math.ceil(products.length / productsPerSlide) },
    (_, index) => products.slice(index * productsPerSlide, index * productsPerSlide + productsPerSlide),
  );
  const sliderLabel = heading
    ? `${heading}. Swipe or use arrow keys to explore.`
    : text.sliderLabel;

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
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 1023px) 25vw, 180px" draggable={false} unoptimized={isRemoteImage(product.image)} onError={fallbackImage} />
          <span className="product-discount-badge">{text.discount.replace("{percent}", String(discount))}</span>
          {product.rating > 0 && <span className="product-image-rating" aria-label={text.rating.replace("{rating}", String(product.rating)).replace("{reviews}", String(product.reviews))}>★ {product.rating}</span>}
          <button type="button" className="product-save" aria-pressed={isSaved} aria-label={(isSaved ? text.unsave : text.save).replace("{name}", product.name)} onClick={() => setSaved(toggleWishlistId(product.id))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          </button>
        </div>
        <h3><Link href={`/${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
        <p className="product-description" title={description}>{description}</p>
        <div className="product-pricing"><strong>{money.format(variant.price)}</strong><del>{money.format(variant.originalPrice)}</del></div>
        <VariantChips name={product.name} variants={variants} selected={selectedIndex} onSelect={index => setVariantIndexes(current => ({ ...current, [product.id]: index }))} onMore={() => setVariantProduct(product)} />
        <div className="product-card-actions">
          <button className="product-details-button" type="button" onClick={() => setVariantProduct(product)}><CartIcon />Add to Cart</button>
          <button className="product-quick-view" type="button" aria-label={`View ${product.name} details`} onClick={() => setSelected(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </article>
    );
  };

  return (
    <section className={`products-section${layout === "related" ? " products-related" : ""}`} aria-labelledby="products-heading" lang={text.language}>
      <div className="products-container">
        <div className="products-header"><h2 id="products-heading">{sectionHeading}</h2>{showViewAll && <Link href="/products" className="products-view-all">{text.viewAll}</Link>}</div>
        {layout === "grid" ? <div id="products-list" className="products-grid">{products.map(renderProduct)}</div> : <div id="products-list">
            <Swiper className="products-slider" modules={[A11y, Keyboard, Mousewheel]} slidesPerView={1.7} spaceBetween={8} breakpoints={{ 451: { slidesPerView: 2.1, spaceBetween: 9 }, 576: { slidesPerView: 2.7, spaceBetween: 10 }, 679: { slidesPerView: 3.5, spaceBetween: 10 }, 877: { slidesPerView: 4.5, spaceBetween: 12 }, 1300: { slidesPerView: 5.5, spaceBetween: 12 } }} keyboard={{ enabled: true, onlyInViewport: true }} mousewheel={{ forceToAxis: true }} a11y={{ containerMessage: sliderLabel, slideLabelMessage: text.columnLabel }} tabIndex={0}>
              {columns.map((column) => <SwiperSlide key={column[0].id}><div className="products-column">{column.map(renderProduct)}</div></SwiperSlide>)}
            </Swiper>
        </div>}
      </div>
      {selected && <AddToCart key={selected.id} product={selected} locale={text.locale} currency={text.currency} saved={saved.includes(selected.id)} onToggleWishlist={() => setSaved(toggleWishlistId(selected.id))} onClose={closeDetails} onOpenProduct={setSelected} />}
      {variantProduct && <Variant product={variantProduct} currency={text.currency} onClose={() => setVariantProduct(null)} onGoToCart={(item: CartItem) => {
        window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
        setVariantProduct(null);
      }} />}
    </section>
  );
}
