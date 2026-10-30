"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import text from "./english.json";
import "./PriceList.css";

type Product = (typeof text.products)[number];
const money = new Intl.NumberFormat(text.locale, { style: "currency", currency: text.currency, maximumFractionDigits: 0 });
const categoryGroups = text.categories.map(category => ({
  ...category,
  products: text.products.filter(product => category.id === "offers" ? product.originalPrice > product.price : product.category === category.id),
}));

function Icon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "fish" ? <><path d="M3 12C8 2 17 5 20 12c-3 7-12 10-17 0Zm0 0-2-4v8l2-4Z" /><circle cx="16" cy="11" r=".8" /><path d="m9 6 3-3 3 3M9 18l3 3 3-3" /></> : kind === "leaf" ? <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8" /></> : kind === "cut" ? <path d="m3 21 7-7M9 15l-3-3L17 2c5 2 5 5 2 8l-6 6-4-1Z" /> : kind === "snow" ? <><path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3" /></> : kind === "percent" ? <><path d="m5 20 14-16" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /></> : kind === "cart" ? <><path d="M2 3h3l3 13h11l3-9H6" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></> : <><path d="m12 2 10 5v10l-10 5-10-5V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5" /></>}
  </svg>;
}

export default function PriceList() {
  const [category, setCategory] = useState(text.categories[0].id);
  const [selected, setSelected] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
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
            <p className="price-region">{text.region}</p>
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
        <header className="price-list-header"><h2 id="price-list-heading">{text.heading} <span>{text.headingHighlight}</span></h2><p><strong className="price-period-label">{text.validLabel}</strong><span className="price-period-dates"><time dateTime={text.validFrom}>{text.validFrom}</time> – <time dateTime={text.validTo}>{text.validTo}</time></span></p></header>
        <p className="price-demo-note">{text.demoNotice}</p>
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
          {text.categories.map(item => (
            <SwiperSlide key={item.id}>
              <button type="button" aria-pressed={category === item.id} aria-controls={`price-category-${item.id}`} onClick={() => scrollToCategory(item.id)}>
                {item.image ? <Image src={`${item.image}?v=transparent-2`} alt="" width={36} height={36} unoptimized className="price-category-image" /> : <Icon kind="percent" />}
                <span>{item.name}</span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
        {categoryGroups.map(group => (
          <section key={group.id} id={`price-category-${group.id}`} className="price-category-section" aria-labelledby={`price-category-heading-${group.id}`}>
            <h2 id={`price-category-heading-${group.id}`} className="price-category-heading">{group.name}</h2>
            <ol className="price-products">{group.products.map((product, index) => <li key={product.id} className="price-product"><div className="price-product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 100px, 190px" /></div><div className="price-product-copy"><h3><Link href={`/productDetails?id=${encodeURIComponent(product.id)}`}>{index + 1}. {product.name}</Link></h3><div className="price-product-cost"><strong>{money.format(product.price)}<span>{text.perUnit.replace("{unit}", product.unit)}</span></strong><del>{money.format(product.originalPrice)}</del><span className="price-discount">{Math.round((1 - product.price / product.originalPrice) * 100)}% {text.off}</span></div></div><button type="button" className="price-product-order" onClick={() => { setSelected(product); dialog.current?.showModal(); }}><Icon kind="cart" />{text.orderNow}</button></li>)}</ol>
            {!group.products.length && <p className="price-empty">{text.empty}</p>}
          </section>
        ))}
      </section>
      <dialog className="price-dialog" ref={dialog} aria-labelledby="price-dialog-title"><button className="price-dialog-close" type="button" onClick={() => dialog.current?.close()}>{text.close} ×</button><h2 id="price-dialog-title">{selected?.name ?? text.preview}</h2>{selected && <><Image src={selected.image} width={220} height={170} alt={selected.name} /><strong>{money.format(selected.price)}{text.perUnit.replace("{unit}", selected.unit)}</strong></>}<p>{text.orderNote}</p><Link href="/products">{text.browse} →</Link></dialog>
    </main>
  );
}
