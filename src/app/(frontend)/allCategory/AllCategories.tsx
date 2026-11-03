"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { loadCategoriesAction } from "@/app/actions";
import type { CategoryTile } from "@/components/category/Category";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import CityPrompt from "@/components/home/CityPrompt";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "@/components/navbar/Navbar";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

function Tile({ category, t }: { category: CategoryTile; t: typeof englishText }) {
  const categoryName = (t.categoryNames as Record<string, string>)?.[category.name] || category.name;
  const cardStyle: CSSProperties & { "--category-shadow-color": string } = {
    backgroundColor: category.color,
    "--category-shadow-color": category.color,
  };
  return (
    <li>
      <Link className="category-card category-card--pill" href={category.href ?? `/products?category=${encodeURIComponent(category.name)}`} style={cardStyle}>
        <div className="category-image">
          <Image src={isRemoteImage(category.image) ? category.image : `${category.image}?v=transparent-2`} unoptimized onError={fallbackImage} draggable={false} alt={categoryName} fill sizes="(max-width: 600px) 42vw, (max-width: 1023px) 26vw, 190px" />
        </div>
        <div className="category-details">
          <h2>{categoryName}</h2>
          <p className="category-count"><strong>{category.types}</strong> {category.types === 1 ? t.productType : t.productTypes}</p>
          <span className="category-arrow" aria-hidden="true">→</span>
        </div>
      </Link>
    </li>
  );
}

/** Every category of the visitor's city. The first page comes with the page; the next ones load as the visitor scrolls. */
export default function AllCategories({
  initial,
  hasMoreInitially,
  hasCity = true,
}: {
  initial: CategoryTile[] | null;
  hasMoreInitially: boolean;
  hasCity?: boolean;
}) {
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
      if (stored === "en" || stored === "bn" || stored === "hi") {
        setCurrentLang(stored);
      }
    } catch {
      // Use fallback
    }

    const handleLanguageChange = (event: Event) => {
      const newLang = (event as CustomEvent<SupportedLang>).detail;
      if (newLang === "en" || newLang === "bn" || newLang === "hi") {
        setCurrentLang(newLang);
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const t = textMap[currentLang] || englishText;

  const [items, setItems] = useState<CategoryTile[] | null>(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(hasMoreInitially);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    setError("");
    const res = await loadCategoriesAction(page + 1).catch(() => null);
    if (!res || "error" in res) setError(res && "error" in res ? res.error : t.couldNotLoadMore);
    else {
      setItems((current) => {
        const list = current || [];
        const seen = new Set(list.map((c) => c.id));
        return [...list, ...res.items.filter((c) => !seen.has(c.id))];
      });
      setPage((p) => p + 1);
      setHasMore(res.hasMore);
    }
    busy.current = false;
    setLoading(false);
  }, [page, hasMore, t.couldNotLoadMore]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) void loadMore(); }, { rootMargin: "500px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  return (
    <main className="all-category-page category-section" lang={t.language}>
      <div className="category-container">
        <header className="category-header">
          <div>
            <h1>{t.heading}</h1>
            <p>{t.description}</p>
          </div>
          <Link className="category-view-all" href="/">{t.backToHome}</Link>
        </header>

        {!hasCity ? (
          <CityPrompt />
        ) : !items ? (
          <p className="home-city-status home-city-status--error" role="alert">
            {t.couldNotLoad}
          </p>
        ) : (
          <>
            <ul className="all-category-grid" aria-label={t.allCategoriesLabel}>
              {items.map((category) => (
                <Tile key={category.id} category={category} t={t} />
              ))}
              {loading && Array.from({ length: 7 }, (_, i) => (
                <li key={`sk-${i}`} aria-hidden="true">
                  <div className="sk all-category-skeleton" />
                </li>
              ))}
            </ul>
            {hasMore && !error && <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />}
            {loading && <span className="sr-only" role="status">{t.loadingMore}</span>}
            {error && (
              <p className="all-category-status" role="alert">
                {error} <button type="button" onClick={() => { setError(""); void loadMore(); }}>{t.tryAgain}</button>
              </p>
            )}
            {!hasMore && items.length > 0 && (
              <p className="all-category-status">{t.allCategoriesEnd}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
