"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import text from "./english.json";
import "./BestSeller.css";

const categoryByGroup: Record<string, string> = {
  vegetables: "Vegetables",
  fruits: "Fruits",
  fish: "Fish & Seafood",
  meat: "Meat & Poultry",
  dairy: "Dairy & Eggs",
  essentials: "Vegetables",
};

export default function BestSeller() {
  const router = useRouter();
  const browse = (groupId: string) => {
    const category = categoryByGroup[groupId];
    router.push(category ? `/products?category=${encodeURIComponent(category)}` : "/products");
  };

  return (
    <section className="bestseller-section" lang={text.language} aria-labelledby="bestseller-heading">
      <div className="bestseller-container">
        <h2 id="bestseller-heading">{text.heading}</h2>
        <ul className="bestseller-grid">
          {text.groups.map(group => (
            <li key={group.id}>
              <button className="bestseller-card" type="button" onClick={() => browse(group.id)} aria-label={text.browseLabel.replace("{name}", group.name)}>
                <span className="bestseller-collage">
                  {group.images.map((image, index) => (
                    <span className={`bestseller-tile bestseller-tile--${index + 1}`} key={`${group.id}-${index}`}>
                      <Image src={image.src} alt={image.alt} fill sizes="(max-width: 450px) 45vw, (max-width: 678px) 30vw, (max-width: 876px) 22vw, 150px" draggable={false} />
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
