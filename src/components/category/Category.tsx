"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import "./Category.css";
import english from "./english.json";

const { categories } = english;

function renderCard(category: (typeof categories)[number]) {
  return (
    <>
              <div className="category-image">
                <Image
                  src={`${category.image}?v=transparent-2`}
                  unoptimized
                  draggable={false}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 42vw, (max-width: 1023px) 26vw, 190px"
                />
              </div>
              <div className="category-details">
                <h3>{category.name}</h3>
                <p className="category-count"><strong>{category.types}</strong> {category.types === 1 ? english.productType : english.productTypes}</p>
                <span className="category-arrow" aria-hidden="true">→</span>
              </div>
    </>
  );
}

export default function Category() {
  return (
    <section className="category-section" aria-labelledby="category-title" lang={english.language}>
      <div className="category-container">
        <div className="category-header">
          <div>
            <h2 id="category-title">{english.heading}</h2>
            <p>{english.description}</p>
          </div>
          <Link className="category-view-all" href="/allCategory">{english.viewAll}</Link>
        </div>
        <div id="category-list">
          <Swiper
              className="category-slider"
              modules={[A11y, Keyboard, Mousewheel]}
              slidesPerView={2.2}
              spaceBetween={8}
              breakpoints={{ 601: { slidesPerView: 3.4, spaceBetween: 10 }, 1024: { slidesPerView: 6.4, spaceBetween: 10 } }}
              keyboard={{ enabled: true, onlyInViewport: true }}
              mousewheel={{ forceToAxis: true }}
              a11y={english.sliderAccessibility}
              tabIndex={0}
            >
              {categories.map((category) => (
                <SwiperSlide key={category.id}>
                  <Link className="category-card" href={`/products?category=${encodeURIComponent(category.name)}`} style={{ backgroundColor: category.color }}>
                    {renderCard(category)}
                  </Link>
                </SwiperSlide>
              ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
