"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import AddToCart from "../modals/AddToCart/AddToCart";
import catalog from "../products/english.json";
import text from "./english.json";
import "./OfferLayout3.css";

type Product = (typeof catalog.products)[number];

const money = new Intl.NumberFormat(text.locale, {
  style: "currency",
  currency: text.currency,
  maximumFractionDigits: 0,
});

const dealProducts: Record<string, Product> = Object.fromEntries(
  text.deals.map(deal => {
    const product = catalog.products.find(item => item.id === deal.productId);
    if (!product) {
      throw new Error(`Winter deal "${deal.id}" references missing product "${deal.productId}"`);
    }
    return [deal.id, { ...product, name: deal.name, price: deal.price, originalPrice: deal.originalPrice, variants: [] }];
  }),
);

function CartIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

function Snowflake({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M24 3v42M5.8 13.5l36.4 21M5.8 34.5l36.4-21M18 8l6 6 6-6M18 40l6-6 6 6M7 21l8-1 2-8M41 27l-8 1-2 8M7 27l8 1 2 8M41 21l-8-1-2-8" /></svg>;
}

export default function OfferLayout3() {
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const closeDetails = useCallback(() => setSelected(null), []);

  return (
    <section className="winter-deals-section" lang={text.language} aria-labelledby="winter-deals-heading">
      <div className="winter-deals-container">
        <aside className="winter-editorial">
          <Snowflake className="winter-editorial-snowflake" />
          <span className="winter-editorial-kicker">{text.kicker}</span>
          <h2 id="winter-deals-heading">{text.heading}<span>{text.headingAccent}</span></h2>
          <p className="winter-editorial-description">{text.description}</p>
          <div className="winter-editorial-offer">
            <span>{text.offerLabel}</span>
            <strong>{text.heroBadge}</strong>
          </div>
          <p className="winter-editorial-note">{text.heroBadgeFoot}</p>
          <div className="winter-editorial-decoration" aria-hidden="true"><span /><span /><span /></div>
        </aside>

        <div className="winter-products-area">
          <header className="winter-products-heading">
            <div>
              <span>{text.collectionLabel}</span>
              <h3>{text.collectionHeading}</h3>
            </div>
          </header>

          <Swiper
            className="winter-product-slider"
            modules={[A11y, Keyboard, Mousewheel]}
            slidesPerView={1.8}
            spaceBetween={8}
            breakpoints={{
              451: { slidesPerView: 2.1, spaceBetween: 8 },
              576: { slidesPerView: 2.5, spaceBetween: 9 },
              877: { slidesPerView: 3.1, spaceBetween: 10 },
              1100: { slidesPerView: 3.7, spaceBetween: 12 },
            }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            mousewheel={{ forceToAxis: true }}
            a11y={{ containerMessage: text.sliderLabel, slideLabelMessage: text.slideLabel }}
            tabIndex={0}
          >
            {text.deals.map(deal => {
              const product = dealProducts[deal.id];
              const isSaved = saved.includes(deal.id);
              const discount = deal.originalPrice > 0 ? Math.round((1 - deal.price / deal.originalPrice) * 100) : 0;

              return (
                <SwiperSlide key={deal.id} className="winter-product-slide">
                <article className="winter-product-card">
                  <div className="winter-product-image">
                    <Image src={deal.image} alt={deal.name} fill sizes="(max-width: 600px) 42vw, (max-width: 1023px) 28vw, 220px" draggable={false} />
                    <span className="winter-product-discount">{text.discount.replace("{percent}", String(discount))}</span>
                    <button
                      className="winter-product-save"
                      type="button"
                      aria-pressed={isSaved}
                      aria-label={(isSaved ? text.unsave : text.save).replace("{name}", deal.name)}
                      onClick={() => setSaved(current => isSaved ? current.filter(id => id !== deal.id) : [...current, deal.id])}
                    >
                      <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                    </button>
                    <span className="winter-product-rating" aria-label={text.rating.replace("{rating}", String(deal.rating)).replace("{reviews}", String(deal.reviews))}>★ {deal.rating}</span>
                  </div>
                  <h4>{deal.name}</h4>
                  <p className="winter-product-description" title={deal.description}>{deal.description}</p>
                  <p className="winter-product-weight">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v8" /></svg>
                    {deal.weight}
                  </p>
                  <div className="winter-product-pricing"><strong>{money.format(deal.price)}</strong><del>{money.format(deal.originalPrice)}</del></div>
                  <button className="winter-product-cart" type="button" onClick={() => setSelected(product)}>
                    <CartIcon />{text.addToCart}
                  </button>
                </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
      {selected && <AddToCart key={selected.id} product={selected} locale={text.locale} currency={text.currency} saved={saved.includes(text.deals.find(deal => deal.productId === selected.id)?.id ?? "")} onToggleWishlist={() => {
        const dealId = text.deals.find(deal => deal.productId === selected.id)?.id;
        if (dealId) setSaved(current => current.includes(dealId) ? current.filter(id => id !== dealId) : [...current, dealId]);
      }} onClose={closeDetails} onOpenProduct={setSelected} />}
    </section>
  );
}
