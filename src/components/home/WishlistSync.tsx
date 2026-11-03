"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getWishlistAction, saveWishlistAction } from "@/lib/sync-client";
import { readWishlistIds, replaceWishlistIds, subscribeToWishlist } from "@/lib/wishlist";

/**
 * Keeps this browser's wishlist the same as the customer's on the server, so a heart tapped in the app shows here at once and the other
 * way round. Nothing renders. Signed in: the account's list is taken over (hearts picked before signing in are added to it).
 */
export const WISHLIST_REMOTE_EVENT = "tazahat:wishlist-remote";

const safeRead = (): string[] => { try { return readWishlistIds(); } catch { return []; } };

export default function WishlistSync() {
  const { user } = useAuth();
  const known = useRef(""); // what the server has (joined): a change equal to it is not sent again
  const applying = useRef(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    const apply = (slugs: string[]) => {
      known.current = slugs.join("|");
      if (safeRead().join("|") === known.current) return;
      applying.current = true;
      replaceWishlistIds(slugs);
      applying.current = false;
    };
    const push = async (slugs: string[]) => { known.current = slugs.join("|"); await saveWishlistAction(slugs); };

    void getWishlistAction().then((res) => {
      if (!res || !alive) return;
      const local = safeRead();
      // hearts picked before signing in join the account's list
      const merged = [...res.slugs, ...local.filter((s) => !res.slugs.includes(s))];
      if (merged.length !== res.slugs.length) { apply(merged); void push(merged); } else apply(res.slugs);
    });

    const unsubscribe = subscribeToWishlist(() => {
      if (applying.current) return;
      const slugs = safeRead();
      if (slugs.join("|") === known.current) return;
      void push(slugs);
    });
    const onRemote = (e: Event) => { const d = (e as CustomEvent<{ slugs?: string[] }>).detail; if (Array.isArray(d?.slugs)) apply(d.slugs); };
    window.addEventListener(WISHLIST_REMOTE_EVENT, onRemote);
    return () => { alive = false; unsubscribe(); window.removeEventListener(WISHLIST_REMOTE_EVENT, onRemote); };
  }, [user]);

  return null;
}
