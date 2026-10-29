"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import "swiper/css";

const banners = [
  {
    image: "/images/banner6.webp",
    alt: "Fresh fish and seafood beside the Hooghly River and Howrah Bridge",
    sideImage: "/images/banner2.webp",
    sideAlt: "Fresh fish, seafood, meat, and poultry",
    eyebrow: "Fresh from the river",
    title: "Fresh catch. Better meals.",
    description: "Carefully selected seafood, brought fresh to your kitchen.",
    action: "Shop seafood",
  },
  {
    image: "/images/banner7.webp",
    alt: "Fresh vegetables, fruit, and dairy from the farm",
    sideImage: "/images/banner3.webp",
    sideAlt: "Fresh dairy products including milk, cheese, and yogurt",
    eyebrow: "Good food, every day",
    title: "Bring home the harvest.",
    description: "Farm-fresh produce and everyday essentials, delivered with care.",
    action: "Shop fresh produce",
  },
];

export default function HomeHero() {
  const startShopping = () => {
    document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();
  };

  return (
    <section className="home-hero" aria-label="Fresh food from TazaHaat">
      <div className="home-content-container">
        <div className="home-banner-grid">
        <Swiper className="home-banner-slider" modules={[A11y, Autoplay, Keyboard]} slidesPerView={1} spaceBetween={0} autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }} keyboard={{ enabled: true, onlyInViewport: true }} rewind a11y={{ containerMessage: "Fresh food banners" }}>
          {banners.map((banner, index) => (
            <SwiperSlide key={banner.image}>
              <article className="home-main-banner">
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 700px) calc(100vw - 32px), 800px"
                    className="home-banner-image"
                  />
                  <div className="home-banner-main-copy">
                    <p className="home-banner-eyebrow">{banner.eyebrow}</p>
                    <h1>{banner.title}</h1>
                    <p className="home-banner-description">{banner.description}</p>
                    <button className="home-banner-shop" type="button" onClick={startShopping}>
                      {banner.action}<span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="home-banner-right-column">
          <button className="home-banner-promo home-banner-promo--reverse" type="button" onClick={startShopping}>
            <span className="home-banner-promo-kicker">Good food, made easy</span>
            <span className="home-banner-promo-title">Fresh picks for your family</span>
            <span className="home-banner-promo-link">Explore the market <b aria-hidden="true">&rarr;</b></span>
          </button>
          <div className="home-banner-side-image">
            <Image src={banners[1].sideImage} alt={banners[1].sideAlt} fill sizes="(max-width: 700px) 50vw, 510px" className="home-banner-image" />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
