"use client";

import { useCallback, useRef, useState } from "react";
import Products from "@/components/products/Products";
import { loadAvailabilityAction } from "@/app/actions";
import type { Product } from "@/lib/api";

/**
 * A home page shelf of products that cannot be ordered yet: "upcoming" (they start selling on a later day, the card says from when)
 * or "soldout" (the card offers Notify me). Same cards as the other shelves, two rows, scrolling sideways; the next 10 load when the
 * visitor reaches the end.
 */
export default function AvailabilityShelf({ kind, heading, initial, hasMore: initialHasMore }: { kind: "upcoming" | "soldout"; heading: string; initial: Product[]; hasMore: boolean }) {
  const [products, setProducts] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const page = useRef(1);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    const res = await loadAvailabilityAction(kind, page.current + 1);
    if ("error" in res) {
      setHasMore(false); // stop asking; a reload of the page starts again
    } else {
      page.current += 1;
      setProducts((current) => {
        const known = new Set(current.map((p) => p.id));
        return [...current, ...res.products.filter((p) => !known.has(p.id))];
      });
      setHasMore(res.hasMore);
    }
    setLoading(false);
    busy.current = false;
  }, [kind, hasMore]);

  return <Products products={products} heading={heading} showViewAll={false} onReachEnd={() => void loadMore()} loadingMore={loading} />;
}
