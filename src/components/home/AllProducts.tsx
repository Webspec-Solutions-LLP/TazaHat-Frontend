"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadProductsAction } from "@/app/actions";
import type { Product } from "@/lib/api";
import Products from "../products/Products";
import { ProductCardsSkeleton } from "../skeleton/Skeletons";

/** Every product on sale in the visitor's city. The first 10 come with the page; more load (10 at a time) as the visitor scrolls. */
export default function AllProducts({ initial, total, cityName }: { initial: Product[]; total: number; cityName: string }) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initial.length < total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    setError("");
    const res = await loadProductsAction(page + 1).catch(() => null);
    if (!res || "error" in res) setError(res && "error" in res ? res.error : "We could not load more products. Please try again.");
    else {
      setItems((current) => {
        const seen = new Set(current.map((p) => p.id));
        return [...current, ...res.products.filter((p) => !seen.has(p.id))];
      });
      setPage((p) => p + 1);
      setHasMore(res.hasMore);
    }
    busy.current = false;
    setLoading(false);
  }, [page, hasMore]);

  // A fresh observer after every page: if the sentinel is still in view (short pages / tall screens) it fires again straight away.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) void loadMore(); }, { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  return (
    <>
      <Products products={items} heading={`All products in ${cityName}`} showViewAll={false} layout="grid" />
      <div className="products-container">
        {hasMore && !error && <div ref={sentinel} className="products-more-sentinel" aria-hidden="true" />}
        {loading && <div className="products-grid" role="status" aria-label="Loading more products" style={{ marginTop: 12 }}><ProductCardsSkeleton count={5} /></div>}
        {error && <p className="products-more-status" role="alert">{error}<button type="button" onClick={() => { setError(""); void loadMore(); }}>Try again</button></p>}
        {!hasMore && items.length > 0 && <p className="products-more-status">You have seen all {total.toLocaleString()} products in {cityName}.</p>}
      </div>
    </>
  );
}
