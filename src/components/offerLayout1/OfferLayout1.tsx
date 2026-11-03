"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import "./OfferLayout1.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export interface OfferBanner { id: string; image: string; title: string | null; details: string | null; buttonText: string | null; href: string | null }

/** The two banners under the slider: the CRM's (`items`) or, when there are none, the designed ones. */
export default function OfferLayout1({ items }: { items?: OfferBanner[] }) {
  const router = useRouter();
  const [language] = useLanguage();
  const text = textMap[language];
  const startShopping = () => {
    document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();
  };

  const open = (href: string | null) => {
    if (!href) return startShopping();
    if (/^https?:\/\//.test(href)) window.open(href, "_blank", "noopener");
    else router.push(href);
  };
  const arrow = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;

  if (items?.length) {
    return (
      <section className="offer-layout-one" aria-label={text.sectionLabel} lang={text.language}>
        <div className="offer-layout-one-container">
          {items.slice(0, 2).map((b, i) => (
            <article className={`offer-banner offer-banner--${i === 0 ? "fish" : "meat"}`} key={b.id} onClick={() => open(b.href)} style={{ cursor: b.href ? "pointer" : undefined }}>
              <Image src={b.image} alt={b.title ?? ""} fill sizes="(max-width: 767px) 100vw, (max-width: 1368px) 50vw, 654px" className="offer-banner-image" unoptimized={isRemoteImage(b.image)} onError={fallbackImage} />
              {(b.title || b.details || b.buttonText) && (
                <div className="offer-banner-content">
                  {b.title && <h2>{b.title}</h2>}
                  {b.details && <p>{b.details}</p>}
                  {b.buttonText && <button type="button" className="offer-banner-button" onClick={(e) => { e.stopPropagation(); open(b.href); }}>{b.buttonText}{arrow}</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  }

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
