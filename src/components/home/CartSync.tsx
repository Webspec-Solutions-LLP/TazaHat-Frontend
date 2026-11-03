"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getCartAction, saveCartAction } from "@/lib/sync-client";
import type { RemoteCartLine } from "@/app/cart-actions";
import { mediaSrc } from "@/lib/api";
import type { CartItem } from "@/components/modals/cart/Cart";

const CART_KEY = "tazahat-cart-v1";
/** this browser tab's own id: the server tells every screen about a change, this one skips what it sent itself */
const CLIENT_ID = `web-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
const sigOf = (l: { variantId: string; cuttingTypeId?: string | null; quantity: number; note?: string | null }[]) => l.map((x) => `${x.variantId}|${x.cuttingTypeId ?? ""}|${x.quantity}|${x.note ?? ""}`).sort().join(",");

/** a line from the server as this browser's own cart item (the same ids the product page and the pop-ups use) */
const toItem = (l: RemoteCartLine): CartItem => ({
  id: `${l.slug ?? l.variantId}-${l.packLabel ?? ""}${l.cuttingTypeId ? `-${l.cuttingTypeId}` : ""}`,
  name: l.name, image: mediaSrc(l.image), price: Math.round(l.unitPaisa / 100), originalPrice: Math.round(l.mrpUnitPaisa / 100), slug: l.slug ?? undefined,
  variantId: l.variantId, packLabel: l.packLabel ?? undefined, cuttingTypeId: l.cuttingTypeId, dressingName: l.dressingName ?? undefined, dressingCharge: Math.round(l.dressingPaisa / 100),
  instruction: l.note ?? undefined, weight: `${l.packLabel ?? ""}${l.dressingName ? ` · ${l.dressingName}` : ""}`, quantity: l.quantity,
});

/**
 * The cart of the signed-in customer is the same on every screen:
 *  - a change made in this browser is copied to the account (the shop's CRM shows it, the app too);
 *  - a change made elsewhere (the shop's team adds / removes an item in the CRM, or the app) arrives live and replaces the cart here, with
 *    no page refresh;
 *  - a new browser whose cart is empty starts from the account's cart.
 * The cart itself stays in the browser. Nothing renders.
 */
export default function CartSync() {
  const { user } = useAuth();
  const sent = useRef<string | null>(null); // the lines the server has (a signature): equal lines are not sent again

  useEffect(() => {
    if (!user) { sent.current = null; return; }
    let busy = false;
    const read = () => {
      try {
        const raw: unknown = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
        return (Array.isArray(raw) ? raw : []).filter((i: { variantId?: string; quantity?: number }) => i && typeof i.variantId === "string" && (i.quantity ?? 0) > 0)
          .map((i: { variantId: string; cuttingTypeId?: string | null; quantity: number; instruction?: string }) => ({ variantId: i.variantId, cuttingTypeId: i.cuttingTypeId ?? null, quantity: i.quantity, note: i.instruction ?? null }));
      } catch { return []; }
    };
    /** the cart of the account replaces this browser's (the header reads it again) */
    const apply = (lines: RemoteCartLine[]) => {
      sent.current = sigOf(lines); // what the server has: this change must not be sent back
      try { window.localStorage.setItem(CART_KEY, JSON.stringify(lines.map(toItem))); } catch { return; }
      window.dispatchEvent(new StorageEvent("storage", { key: CART_KEY }));
    };
    const push = async () => {
      if (busy) return;
      const l = read();
      const sig = sigOf(l);
      if (sig === sent.current) return;
      busy = true;
      const ok = await saveCartAction(l, CLIENT_ID);
      busy = false;
      if (ok) sent.current = sig;
    };
    const onRemote = (e: Event) => {
      const d = (e as CustomEvent<{ lines?: RemoteCartLine[]; clientId?: string | null }>).detail;
      const lines = d?.lines;
      if (!Array.isArray(lines) || d?.clientId === CLIENT_ID) return;
      if (sigOf(lines) === sigOf(read())) { sent.current = sigOf(lines); return; }
      apply(lines);
    };
    window.addEventListener("tazahat:cart-remote", onRemote);
    // first: an empty cart here starts from the account's; otherwise this browser's cart is copied to the account
    void (async () => {
      if (read().length === 0) {
        const remote = await getCartAction();
        if (remote && remote.length) { apply(remote); return; }
      }
      void push();
    })();
    const timer = window.setInterval(() => void push(), 1500); // the cart is written by several screens: a quiet check is enough
    window.addEventListener("storage", push);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", push); window.removeEventListener("tazahat:cart-remote", onRemote); };
  }, [user]);

  return null;
}
