"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import text from "./english.json";
import catalog from "../products/english.json";
import "../products/Products.css";
import "./TodayDeals.css";

type Product = (typeof catalog.products)[number];
const money = new Intl.NumberFormat(text.locale, { style: "currency", currency: text.currency, maximumFractionDigits: 0 });

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export default function TodalDeals() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    // Demo offer ends at the next midnight in India; use the catalog deadline when available.
    const offset = 330 * 60 * 1000;
    const deadline = Math.floor((Date.now() + offset) / 86400000) * 86400000 + 86400000 - offset;
    const tick = () => setRemaining(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const clock = [
    { label: text.days, value: remaining === null ? null : Math.floor(remaining / 86400) },
    { label: text.hours, value: remaining === null ? null : Math.floor(remaining / 3600) % 24 },
    { label: text.minutes, value: remaining === null ? null : Math.floor(remaining / 60) % 60 },
    { label: text.seconds, value: remaining === null ? null : remaining % 60 },
  ];
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const renderProduct = (product: Product) => {
    const isSaved = saved.includes(product.id);
    const discount = product.originalPrice > 0 ? Math.max(0, Math.round((1 - product.price / product.originalPrice) * 100)) : 0;
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
        <h3>{product.name}</h3>
        <p className="product-description" title={description}>{description}</p>
        <p className="product-weight"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v8M7.5 5.5l9 5" /></svg>{product.weight}</p>
        <div className="product-pricing"><strong>{money.format(product.price)}</strong><del>{money.format(product.originalPrice)}</del></div>
        <button className="product-details-button" type="button" onClick={() => { setSelected(product); dialog.current?.showModal(); }}><CartIcon />Add to Cart</button>
      </article>
    );
  };

  return (
    <section className="products-section today-deals-section" aria-labelledby="deals-heading" lang={text.language}>
      <div className="products-container today-deals-panel">
        <div className="products-header deals-header">
          <div className="deals-title"><svg viewBox="0 0 24 32" fill="currentColor" aria-hidden="true"><path d="M14 1 2 18h9l-2 13 13-19h-9l3-11Z" /></svg><div><h2 id="deals-heading">{text.heading}</h2><p>{text.description}</p></div></div>
          <div className="deals-countdown" role="timer" aria-label={text.offerEnds}><span>{text.offerEnds}</span><div className="deals-clock">{clock.map(unit => <div className="deals-time" key={unit.label}><strong>{unit.value === null ? "--" : String(unit.value).padStart(2, "0")}</strong><span>{unit.label}</span></div>)}</div></div>
          <button type="button" className="deals-view-all" aria-expanded={showAll} aria-controls="deals-list" onClick={() => setShowAll(!showAll)}>{showAll ? text.showLess : text.viewAll}</button>
        </div>
        <div id="deals-list">
          {showAll ? <div className="products-grid">{catalog.products.map(renderProduct)}</div> : (
            <Swiper className="products-slider" modules={[A11y, Keyboard, Mousewheel]} slidesPerView={2.2} spaceBetween={10} breakpoints={{ 601: { slidesPerView: 4.2, spaceBetween: 12 }, 1024: { slidesPerView: 6.5, spaceBetween: 12 } }} keyboard={{ enabled: true, onlyInViewport: true }} mousewheel={{ forceToAxis: true }} a11y={{ containerMessage: text.sliderLabel, slideLabelMessage: text.columnLabel }} tabIndex={0}>
              {catalog.products.map(product => <SwiperSlide key={product.id}>{renderProduct(product)}</SwiperSlide>)}
            </Swiper>
          )}
        </div>
      </div>
      <dialog ref={dialog} className="product-dialog" aria-labelledby="deal-dialog-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <button className="product-dialog-close" type="button" onClick={() => dialog.current?.close()}>{text.close} ×</button>
        {selected && <><Image src={selected.image} alt={selected.name} width={240} height={200} className="product-dialog-image" /><h2 id="deal-dialog-title">{selected.name}</h2><p>{selected.weight}</p><strong>{money.format(selected.price)}</strong><p className="product-demo-note">{text.demoNote}</p></>}
      </dialog>
    </section>
  );
}
