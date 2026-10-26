"use client";

import Image from "next/image";
import text from "./english.json";
import "./BestSeller.css";

export default function BestSeller() {
  const browse = () => document.querySelector<HTMLInputElement>(".navbar-search-input")?.focus();

  return (
    <section className="bestseller-section" lang={text.language} aria-labelledby="bestseller-heading">
      <div className="bestseller-container">
        <h2 id="bestseller-heading">{text.heading}</h2>
        <ul className="bestseller-grid">
          {text.groups.map(group => (
            <li key={group.id}>
              <button className="bestseller-card" type="button" onClick={browse} aria-label={text.browseLabel.replace("{name}", group.name)}>
                <span className="bestseller-collage">
                  {group.images.map((image, index) => (
                    <span className={`bestseller-tile bestseller-tile--${index + 1}`} key={`${group.id}-${index}`}>
                      <Image src={image.src} alt={image.alt} fill sizes="(max-width: 600px) 22vw, (max-width: 1023px) 14vw, 100px" draggable={false} />
                    </span>
                  ))}
                </span>
                <span className="bestseller-more">{text.moreLabel.replace("{count}", String(group.more))}</span>
                <span className="bestseller-name">{group.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
