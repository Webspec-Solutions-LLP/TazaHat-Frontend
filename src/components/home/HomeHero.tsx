"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const benefits = [
  { icon: "leaf", title: "100% Fresh", description: "Farm to Home" },
  { icon: "shield", title: "Hygienic & Safe", description: "Cleaned & Packed" },
  { icon: "truck", title: "Fast & On-Time", description: "Delivery" },
  { icon: "quality", title: "Best Quality", description: "At Best Price" },
];

function BenefitIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {kind === "leaf" ? <>
        <path d="M9 30C3 17 18 10 39 5c3 22-4 34-19 32" fill="#28a745" />
        <path d="M8 42 32 16M16 33 14 22M23 26l10-1" stroke="#d4f5cf" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 29C4 29 1 21 3 13c8 2 13 8 9 16Z" fill="#65bd45" />
      </> : kind === "truck" ? <>
        <path d="M7 9h23v27H7zM30 18h9l7 10v8H30z" fill="currentColor" />
        <path d="M34 21h4l5 7h-9z" fill="#c5edff" />
        <path d="M2 16h12M1 23h10M3 30h8" stroke="#168cff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="15" cy="37" r="5" fill="#07366b" stroke="white" strokeWidth="2" />
        <circle cx="37" cy="37" r="5" fill="#07366b" stroke="white" strokeWidth="2" />
      </> : <>
        {kind === "quality" ? <path d="m24 2 6 4 7 1 3 7 5 5-2 8 1 7-7 4-5 7-8-2-8 2-5-7-7-4 1-7-2-8 5-5 3-7 7-1Z" fill="currentColor" /> : <path d="M24 3c6 5 12 7 18 8v13c0 10-9 17-18 21C15 41 6 34 6 24V11c6-1 12-3 18-8Z" fill="currentColor" />}
        {kind === "quality" && <circle cx="24" cy="24" r="13" stroke="#5ec6ff" strokeWidth="2" />}
        <path d="m16 24 6 6 11-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </svg>
  );
}

export default function HomeHero() {
  const startShopping = () => {
    document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();
  };

  return (
    <section className="home-hero" aria-label="Fresh food from TazaHaat">
      <div className="home-content-container">
        <Swiper className="home-banner-slider" modules={[A11y, Autoplay, Pagination, Keyboard]} slidesPerView={1} spaceBetween={16} autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }} pagination={{ clickable: true }} keyboard={{ enabled: true, onlyInViewport: true }} rewind a11y={{ containerMessage: "Fresh food banners" }}>
          <SwiperSlide>
      <div className="home-banner-grid">
        <div className="home-main-banner">
          <Image src="/images/banner1.png" alt="Fresh fish and seafood beside the river and Howrah Bridge" fill priority sizes="(max-width: 700px) 100vw, (max-width: 1368px) 60vw, 790px" className="home-banner-image" />
          <div className="home-banner-wash" />
          <div className="home-banner-copy">
            <p className="home-banner-eyebrow">Fresh from the source</p>
            <h1>River to your table.</h1>
            <p className="home-banner-description">Fresh fish, quality meats &amp; everyday essentials, delivered to your door.</p>
            <button className="home-banner-shop" type="button" onClick={startShopping}>Shop Fresh Now <span aria-hidden="true">&rarr;</span></button>
          </div>
        </div>
        <button className="home-side-banner home-side-banner--essentials" type="button" onClick={startShopping} aria-label="Shop fresh essentials for your home">
          <Image src="/images/banner2.png" alt="Fresh essentials for your home. Fish, meat, vegetables, fruits, dairy and groceries." fill sizes="(max-width: 700px) 100vw, (max-width: 1368px) 40vw, 520px" className="home-banner-image" />
        </button>
        <button className="home-side-banner home-side-banner--groceries" type="button" onClick={startShopping} aria-label="Shop fresh groceries for your home">
          <Image src="/images/banner3.png" alt="Fresh groceries for your home. Farm fresh products, hygienic packing and fast delivery." fill sizes="(max-width: 700px) 100vw, (max-width: 1368px) 40vw, 520px" className="home-banner-image" />
        </button>
      </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="home-banner-grid home-banner-grid--reverse">
              <div className="home-diagonal-banners">
                <button className="home-triangle home-triangle--top" type="button" onClick={startShopping} aria-label="Shop fresh essentials">
                  <span className="home-triangle-art"><Image src="/images/products/product--5.png" alt="" fill sizes="260px" className="home-triangle-image" /></span>
                  <span className="home-triangle-copy">Fresh essentials<span>Shop now &rarr;</span></span>
                </button>
                <button className="home-triangle home-triangle--bottom" type="button" onClick={startShopping} aria-label="Shop farm fresh groceries">
                  <span className="home-triangle-art"><Image src="/images/category/category2.png?v=transparent-2" alt="" fill unoptimized sizes="300px" className="home-triangle-image" /></span>
                  <span className="home-triangle-copy">Farm fresh picks<span>Shop groceries &rarr;</span></span>
                </button>
              </div>
              <button className="home-side-banner home-reverse-main" type="button" onClick={startShopping} aria-label="Shop fresh groceries for your home">
                <Image src="/images/banner3.png" alt="Fresh groceries for your home. Farm fresh products, hygienic packing and fast delivery." fill sizes="(max-width: 700px) 100vw, 60vw" className="home-banner-image" />
              </button>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
      <div className="home-content-container home-benefits-container">
        <ul className="home-benefits" aria-label="Why shop with TazaHaat">
          {benefits.map(({ icon, title, description }) => (
            <li className="home-benefit" key={icon}>
              <span className="home-benefit-icon"><BenefitIcon kind={icon} /></span>
              <div><h2>{title}</h2><p>{description}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
