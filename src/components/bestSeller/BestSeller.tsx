"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import "./BestSeller.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

const categoryByGroup: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish & Seafood",
  meat: "Meat & Poultry",
  dairy: "Dairy & Eggs",
  essentials: "Vegetables",
};

export interface BestSellerGroup { id: string; name: string; slug?: string; more: number; images: { src: string; alt: string }[] }

/** columns for n tiles when at most `max` fit in a row: the rows come out as even as possible (4 tiles: one row; 8 tiles: 4 + 4), so no row is left with a gap */
const columnsFor = (n: number, max: number) => (n <= 0 ? 1 : Math.ceil(n / Math.ceil(n / max)));

export default function BestSeller({ groups }: { groups?: BestSellerGroup[] }) {
  const [language] = useLanguage();
  const text = textMap[language];
  const shownGroups = groups ?? text.groups;
  const router = useRouter();
  const browse = (group: BestSellerGroup) => {
    if (group.slug) return router.push(`/products?category=${encodeURIComponent(group.slug)}`);
    const category = categoryByGroup[group.id];
    router.push(category ? `/products?category=${encodeURIComponent(category)}` : "/products");
  };

  return (
    <section className="bestseller-section" lang={text.language} aria-labelledby="bestseller-heading">
      <div className="bestseller-container">
        <h2 id="bestseller-heading">{text.heading}</h2>
        <ul className="bestseller-grid" style={{ "--bs-cols": columnsFor(shownGroups.length, 6), "--bs-cols-tablet": columnsFor(shownGroups.length, 4) } as React.CSSProperties}>
          {shownGroups.map(group => (
            <li key={group.id}>
              <button className="bestseller-card" type="button" onClick={() => browse(group)} aria-label={text.browseLabel.replace("{name}", group.name)}>
                <span className="bestseller-collage" style={{ "--bs-imgs": Math.min(Math.max(group.images.length, 1), 4) } as React.CSSProperties}>
                  {group.images.map((image, index) => (
                    <span className={`bestseller-tile bestseller-tile--${index + 1}`} key={`${group.id}-${index}`}>
                      <Image src={image.src} alt={image.alt} fill sizes="(max-width: 450px) 45vw, (max-width: 678px) 30vw, (max-width: 876px) 22vw, 150px" draggable={false} unoptimized={isRemoteImage(image.src)} onError={fallbackImage} />
                    </span>
                  ))}
                </span>
                {group.more > 0 && <span className="bestseller-more">{text.moreLabel.replace("{count}", String(group.more))}</span>}
                <span className="bestseller-name">{group.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
