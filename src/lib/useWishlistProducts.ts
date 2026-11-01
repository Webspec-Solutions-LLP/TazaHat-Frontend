"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadWishlistProductsAction } from "@/app/actions";
import type { Product } from "@/lib/api";
import { getServerWishlistSnapshot, getWishlistSnapshot, parseWishlistSnapshot, subscribeToWishlist } from "@/lib/wishlist";

/**
 * The products on the visitor's wishlist (the list itself is kept in the browser), read from the shop for the chosen city.
 * `loading` is true until the first answer; products that are not sold in the city are not in the result.
 */
export function useWishlistProducts() {
  const snapshot = useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const ids = parseWishlistSnapshot(snapshot);
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; products: Product[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    // the list can change often (a heart tapped on another tab): look again a moment after the last change
    const timer = window.setTimeout(() => {
      void loadWishlistProductsAction(key.split(",")).then((products) => { if (!cancelled) setState({ key, products }); });
    }, 150);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [key]);

  const loading = ids.length > 0 && state?.key !== key;
  // products of an earlier list that are no longer on it disappear at once
  const products = ids.length ? (state?.products ?? []).filter((p) => ids.includes(p.id)) : [];
  return { products, loading, count: ids.length };
}
