"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import text from "./english.json";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import "./BestSeller.css";

const categoryByGroup: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish & Seafood",
  meat: "Meat & Poultry",
  dairy: "Dairy & Eggs",
  essentials: "Vegetables",
};

export interface BestSellerGroup { id: string; name: string; slug?: string; more: number; images: { src: string; alt: string }[] }

export default function BestSeller({ groups = text.groups }: { groups?: BestSellerGroup[] }) {
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
        <ul className="bestseller-grid">
          {groups.map(group => (
            <li key={group.id}>
              <button className="bestseller-card" type="button" onClick={() => browse(group)} aria-label={text.browseLabel.replace("{name}", group.name)}>
                <span className="bestseller-collage">
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
