"use client";

import { useCallback, useState } from "react";
import AddToCart from "../modals/AddToCart/AddToCart";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import text from "./english.json";
import "./Products.css";

type Product = (typeof text.products)[number];
const money = new Intl.NumberFormat(text.locale, { style: "currency", currency: text.currency, maximumFractionDigits: 0 });
// Each slide is a column of two cards, so both rows move together.
const columns = Array.from({ length: Math.ceil(text.products.length / 2) }, (_, index) => text.products.slice(index * 2, index * 2 + 2));

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export default function Products() {
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const closeDetails = useCallback(() => setSelected(null), []);

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
          <button type="button" className="product-save" aria-pressed={isSaved} aria-label={(isSaved ? text.unsave : text.save).replace("{name}", product.name)} onClick={() => setSaved(current => isSaved ? current.filter(id => id !== product.id) : [...current, product.id])}>
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
        <button className="product-details-button" type="button" onClick={() => setSelected(product)}><CartIcon />Add to Cart</button>
      </article>
    );
  };

  return (
    <section className="products-section" aria-labelledby="products-heading" lang={text.language}>
      <div className="products-container">
        <div className="products-header"><h2 id="products-heading">{text.heading}</h2><Link href="/products" className="products-view-all">{text.viewAll}</Link></div>
        <div id="products-list">
            <Swiper className="products-slider" modules={[A11y, Keyboard, Mousewheel]} slidesPerView={2.2} spaceBetween={10} breakpoints={{ 601: { slidesPerView: 4.2, spaceBetween: 12 }, 1024: { slidesPerView: 6.5, spaceBetween: 12 } }} keyboard={{ enabled: true, onlyInViewport: true }} mousewheel={{ forceToAxis: true }} a11y={{ containerMessage: text.sliderLabel, slideLabelMessage: text.columnLabel }} tabIndex={0}>
              {columns.map((column) => <SwiperSlide key={column[0].id}><div className="products-column">{column.map(renderProduct)}</div></SwiperSlide>)}
            </Swiper>
        </div>
      </div>
      {selected && <AddToCart key={selected.id} product={selected} locale={text.locale} currency={text.currency} saved={saved.includes(selected.id)} onToggleWishlist={() => setSaved(current => current.includes(selected.id) ? current.filter(id => id !== selected.id) : [...current, selected.id])} onClose={closeDetails} />}
    </section>
  );
}
