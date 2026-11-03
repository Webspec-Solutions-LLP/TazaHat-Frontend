"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { loadWishlistProductsAction } from "@/app/actions";
import { getCompareAction, saveCompareAction } from "@/lib/sync-client";
import { COMPARE_CHANGE_EVENT, COMPARE_STORAGE_KEY, type CompareProduct } from "./CompareList";

/**
 * Keeps this browser's compare list (localStorage) the same as the customer's list on the server, so what is picked on the website shows in
 * the app and the other way round, live. Nothing renders. A guest keeps a browser-only list.
 *   sign-in: the server's list is taken over (a list picked before signing in is kept when the server has none)
 *   a change here  -> sent to the server;   a change elsewhere (live event "compare") -> written here.
 */
export const COMPARE_REMOTE_EVENT = "tazahat:compare-remote";

const read = (): CompareProduct[] => {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]");
    return Array.isArray(list) ? (list as CompareProduct[]) : [];
  } catch { return []; }
};

export default function CompareSync() {
  const { user } = useAuth();
  const known = useRef(""); // the list the server has (slugs joined): a change equal to it is not sent again
  const applying = useRef(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    const apply = async (slugs: string[]) => {
      known.current = slugs.join("|");
      const local = read();
      if (local.map((i) => i.id).join("|") === known.current) return;
      const have = new Map(local.map((i) => [i.id, i]));
      const missing = slugs.filter((s) => !have.has(s));
      const fetched = missing.length ? await loadWishlistProductsAction(missing).catch(() => []) : [];
      const byId = new Map<string, CompareProduct>(have);
      for (const p of fetched) byId.set(p.id, { id: p.id, name: p.name, image: p.image, price: p.price, originalPrice: p.originalPrice, rating: p.rating, reviews: p.reviews, unit: p.weight });
      if (!alive) return;
      const items = slugs.map((s) => byId.get(s)).filter((x): x is CompareProduct => !!x);
      applying.current = true;
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
      applying.current = false;
    };

    const push = async (slugs: string[]) => {
      known.current = slugs.slice(0, 4).join("|");
      await saveCompareAction(slugs);
    };

    void getCompareAction().then((res) => {
      if (!res || !alive) return;
      const local = read();
      if (res.slugs.length === 0 && local.length > 0) void push(local.map((i) => i.id));
      else void apply(res.slugs);
    });

    const onLocal = () => {
      if (applying.current) return;
      const slugs = read().map((i) => i.id);
      if (slugs.slice(0, 4).join("|") === known.current) return;
      void push(slugs);
    };
    const onRemote = (e: Event) => { const d = (e as CustomEvent<{ slugs?: string[] }>).detail; if (Array.isArray(d?.slugs)) void apply(d.slugs); };
    window.addEventListener(COMPARE_CHANGE_EVENT, onLocal);
    window.addEventListener(COMPARE_REMOTE_EVENT, onRemote);
    return () => { alive = false; window.removeEventListener(COMPARE_CHANGE_EVENT, onLocal); window.removeEventListener(COMPARE_REMOTE_EVENT, onRemote); };
  }, [user]);

  return null;
}
