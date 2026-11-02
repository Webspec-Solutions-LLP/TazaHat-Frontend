"use client";

import PackAction, { StockRibbon, firstOrderable } from "@/components/availability/PackAction";
import type { Product } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import AddToCart from "../modals/AddToCart/AddToCart";
import Variant from "../modals/variant/Variant";
import type { CartItem } from "../modals/cart/Cart";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "../../lib/wishlist";
import { fallbackImage, isRemoteImage } from "../../lib/api";
import "./Products.css";
import VariantChips from "@/components/products/VariantChips";
import { ProductCardSkeleton } from "@/components/skeleton/Skeletons";


const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};
interface ProductsProps {
  heading?: string;
  products: Product[];
  showViewAll?: boolean;
  layout?: "catalog" | "related" | "grid";
  /** the shelf reached its last card: load more (the home page shelves of upcoming / sold out products add 10 at a time) */
  onReachEnd?: () => void;
  /** more cards are on their way: a skeleton column waits at the end */
  loadingMore?: boolean;
  /** cards stacked in each column: 1 = a single row, 2 = two rows (default: two, the "related" shelf with few products uses one) */
  rows?: 1 | 2;
}

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export default function Products({ heading, products, showViewAll = true, layout = "catalog", onReachEnd, loadingMore = false, rows }: ProductsProps) {
  const [language] = useLanguage();
  const text = textMap[language];
  const displayedProducts = products ?? text.products;
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: text.currency, maximumFractionDigits: 0 });
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const closeDetails = useCallback(() => setSelected(null), [setSelected]);
  useEffect(() => {
    const refreshWishlist = () => setSaved(readWishlistIds());
    refreshWishlist();
    return subscribeToWishlist(refreshWishlist);
  }, []);
  const sectionHeading = heading ?? text.heading;
  const productsPerSlide = rows ?? (layout === "related" && displayedProducts.length <= 10 ? 1 : 2);
  const columns = Array.from(
    { length: Math.ceil(displayedProducts.length / productsPerSlide) },
    (_, index) => displayedProducts.slice(index * productsPerSlide, index * productsPerSlide + productsPerSlide),
  );
  const sliderLabel = heading
    ? `${heading}. Swipe or use arrow keys to explore.`
    : text.sliderLabel;

  const renderProduct = (product: Product) => {
    const isSaved = saved.includes(product.id);
    const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
    const initialVariant = firstOrderable(variants, Math.max(0, variants.findIndex(variant => variant.price === product.price)));
    const selectedIndex = variantIndexes[product.id] ?? initialVariant;
    const variant = variants[selectedIndex] ?? variants[0];
    const discount = variant.originalPrice > 0 ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100)) : 0;
    const description = text.productDescription.replace("{name}", product.name);
    return (
      <article className="product-card" key={product.id}>
        <div className="product-image">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 1023px) 25vw, 180px" draggable={false} unoptimized={isRemoteImage(product.image)} onError={fallbackImage} />
          <StockRibbon pack={variant} />
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
          <PackAction pack={variant} className="product-details-button" onAdd={() => setVariantProduct(product)}><CartIcon />{text.addToCart}</PackAction>
          <button className="product-quick-view" type="button" aria-label={text.quickView.replace("{name}", product.name)} onClick={() => setSelected(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </article>
    );
  };

  return (
    <section className={`products-section${layout === "related" ? " products-related" : ""}`} aria-labelledby="products-heading" lang={text.language}>
      <div className="products-container">
        <div className="products-header"><h2 id="products-heading">{sectionHeading}</h2>{showViewAll && <Link href="/products" className="products-view-all">{text.viewAll}</Link>}</div>
        {layout === "grid" ? <div id="products-list" className="products-grid">{displayedProducts.map(renderProduct)}</div> : <div id="products-list">
            <Swiper className="products-slider" modules={[A11y, Keyboard, Mousewheel]} slidesPerView={1.7} spaceBetween={8} breakpoints={{ 451: { slidesPerView: 2.1, spaceBetween: 9 }, 576: { slidesPerView: 2.7, spaceBetween: 10 }, 679: { slidesPerView: 3.5, spaceBetween: 10 }, 877: { slidesPerView: 4.5, spaceBetween: 12 }, 1300: { slidesPerView: 5.5, spaceBetween: 12 } }} keyboard={{ enabled: true, onlyInViewport: true }} mousewheel={{ forceToAxis: true }} a11y={{ containerMessage: sliderLabel, slideLabelMessage: text.columnLabel }} tabIndex={0} onReachEnd={() => onReachEnd?.()} onAfterInit={swiper => { if (swiper.isEnd) onReachEnd?.(); }}>
              {columns.map((column) => <SwiperSlide key={column[0].id}><div className={`products-column${productsPerSlide === 1 ? " is-single" : ""}`}>{column.map(renderProduct)}</div></SwiperSlide>)}
              {loadingMore && <SwiperSlide key="loading-more"><div className="products-column" role="status" aria-label="Loading more products"><ProductCardSkeleton />{productsPerSlide === 2 && <ProductCardSkeleton />}</div></SwiperSlide>}
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
