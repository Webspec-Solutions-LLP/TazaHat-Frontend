"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import text from "./english.json";
import "./OfferLayout2.css";

function FreshIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "shield" ? <><path d="m12 2 8 3v7c0 6-8 10-8 10S4 18 4 12V5l8-3Z" /><path d="m8 12 3 3 5-6" /></> : kind === "truck" ? <><path d="M2 5h12v12H2zM14 9h4l4 5v3h-8M3 10h5" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></> : kind === "heart" ? <path d="M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-7 5 8 17 8 17S27 9 20 4Z" /> : kind === "smile" ? <><circle cx="12" cy="12" r="10" /><path d="M7 14c2 5 8 5 10 0M8 8h.01M16 8h.01" /></> : <><path d="M12 20C2 21 1 10 3 5c8 0 11 4 9 15ZM12 16C12 7 16 3 22 3c1 8-2 13-10 13ZM6 10l6 10 7-12" /></>}
  </svg>;
}

export default function OfferLayout2() {
  const router = useRouter();
  const shop = (category?: string) => {
    router.push(category ? `/products?category=${encodeURIComponent(category)}` : "/products");
  };
  return (
    <section className="fresh-offer-section" lang={text.language} aria-labelledby="fresh-picks-heading">
      <div className="fresh-offer-layout" style={{ backgroundImage: `url(${text.background})` }}>
        <div className="fresh-offer-hero" style={{ backgroundImage: `url(${text.background})` }}>
          <div className="fresh-offer-hero-copy">
            <span className="fresh-farm-badge"><FreshIcon kind="leaf" />{text.badge}</span>
            <h2>{text.heroTitle}<span>{text.heroHighlight}</span></h2>
            <p>{text.heroDescription}</p>
            <button type="button" onClick={() => shop()}>{text.heroButton}<span aria-hidden="true">→</span></button>
          </div>
          <div className="fresh-farm-sign"><FreshIcon kind="leaf" /><span>{text.farmNote}</span><strong>{text.farmHighlight}</strong></div>
        </div>
        <div className="fresh-picks-main">
          <header className="fresh-picks-header">
            <div><h2 id="fresh-picks-heading"><svg viewBox="0 0 24 30" aria-hidden="true"><path fill="#ff7b13" d="M13 0c3 8 10 10 10 19a11 11 0 0 1-22 0c0-5 3-9 6-12 0 6 2 7 3 7 3-3 4-8 3-14Z" /><path fill="#fff5bb" d="M13 13c0 5 5 7 4 11-2 6-10 5-10-1 0-3 4-5 6-10Z" /></svg>{text.heading}</h2><p>{text.description}</p></div>
            <a href="#category-list" className="fresh-view-all">{text.viewAll}<span aria-hidden="true">→</span></a>
          </header>
          <div className="fresh-pick-cards">
            {text.categories.map(category => <article className={`fresh-pick-card fresh-theme--${category.theme}`} key={category.id}>
              <div className="fresh-pick-discount"><small>{text.upTo}</small><strong>{category.discount}%</strong><span>{text.off}</span></div>
              <div className="fresh-pick-image"><Image src={`${category.image}?v=transparent-2`} alt={category.name} fill unoptimized sizes="(max-width: 600px) 40vw, 160px" /></div>
              <div className="fresh-pick-details"><FreshIcon kind="leaf" /><h3><span>{text.fresh}</span>{category.name}</h3><button type="button" onClick={() => shop(category.name)}>{text.shopNow}<span aria-hidden="true">→</span></button></div>
            </article>)}
          </div>
          <ul className="fresh-picks-benefits">{text.benefits.map(benefit => <li key={benefit.title}><FreshIcon kind={benefit.icon} /><div><strong>{benefit.title}</strong><span>{benefit.description}</span></div></li>)}</ul>
        </div>
        <aside className="fresh-reasons"><h2>{text.whyHeading}</h2><ul>{text.reasons.map(reason => <li key={reason.title}><span className={`fresh-reason-icon fresh-reason--${reason.theme}`}><FreshIcon kind={reason.icon} /></span><div><strong>{reason.title}</strong><p>{reason.description}</p></div></li>)}</ul></aside>
      </div>
    </section>
  );
}
