"use client";

import Image from "next/image";
import text from "./english.json";
import "./OfferLayout1.css";

export default function OfferLayout1() {
  const startShopping = () => {
    document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();
  };

  return (
    <section className="offer-layout-one" aria-label={text.sectionLabel} lang={text.language}>
      <div className="offer-layout-one-container">
        {text.offers.map(offer => (
          <article className={`offer-banner offer-banner--${offer.id}`} key={offer.id}>
            <Image src={offer.image} alt={offer.imageAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1368px) 50vw, 654px" className="offer-banner-image" />
            <div className="offer-banner-content">
              <h2>{offer.title}</h2>
              <p>{offer.description}</p>
              {offer.benefits.length > 0 && (
                <ul className="offer-banner-benefits">
                  {offer.benefits.map(benefit => (
                    <li key={benefit}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="offer-banner-button" onClick={startShopping}>
                {offer.button}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
