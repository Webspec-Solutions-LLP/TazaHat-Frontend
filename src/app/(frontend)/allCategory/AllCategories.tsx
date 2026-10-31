"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadCategoriesAction } from "@/app/actions";
import type { CategoryTile } from "@/components/category/Category";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import english from "@/components/category/english.json";

function Tile({ category }: { category: CategoryTile }) {
  return (
    <li>
      <Link className="category-card" href={category.href ?? `/products?category=${encodeURIComponent(category.name)}`} style={{ backgroundColor: category.color }}>
        <div className="category-image">
          <Image src={isRemoteImage(category.image) ? category.image : `${category.image}?v=transparent-2`} unoptimized onError={fallbackImage} draggable={false} alt={category.name} fill sizes="(max-width: 600px) 42vw, (max-width: 1023px) 26vw, 190px" />
        </div>
        <div className="category-details">
          <h2>{category.name}</h2>
          <p className="category-count"><strong>{category.types}</strong> {category.types === 1 ? english.productType : english.productTypes}</p>
          <span className="category-arrow" aria-hidden="true">→</span>
        </div>
      </Link>
    </li>
  );
}

/** Every category of the visitor's city. The first page comes with the page; the next ones load as the visitor scrolls. */
export default function AllCategories({ initial, hasMoreInitially }: { initial: CategoryTile[]; hasMoreInitially: boolean }) {
  const [items, setItems] = useState(initial);
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
    if (!res || "error" in res) setError(res && "error" in res ? res.error : "We could not load more categories. Please try again.");
    else {
      setItems((current) => {
        const seen = new Set(current.map((c) => c.id));
        return [...current, ...res.items.filter((c) => !seen.has(c.id))];
      });
      setPage((p) => p + 1);
      setHasMore(res.hasMore);
    }
    busy.current = false;
    setLoading(false);
  }, [page, hasMore]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) void loadMore(); }, { rootMargin: "500px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  return (
    <>
      <ul className="all-category-grid" aria-label={english.allCategoriesLabel}>
        {items.map((category) => <Tile key={category.id} category={category} />)}
        {loading && Array.from({ length: 7 }, (_, i) => <li key={`sk-${i}`} aria-hidden="true"><div className="sk all-category-skeleton" /></li>)}
      </ul>
      {hasMore && !error && <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />}
      {loading && <span className="sr-only" role="status">Loading more categories</span>}
      {error && <p className="all-category-status" role="alert">{error} <button type="button" onClick={() => { setError(""); void loadMore(); }}>Try again</button></p>}
      {!hasMore && items.length > 0 && <p className="all-category-status">That is every category in your city.</p>}
    </>
  );
}
