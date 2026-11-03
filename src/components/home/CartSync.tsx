"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { saveCartAction } from "@/app/cart-actions";

const CART_KEY = "tazahat-cart-v1";

/**
 * Sends a copy of this browser's cart to the customer's account whenever it changes (signed in only), so the shop's CRM can show what each
 * customer is about to order, live. The cart itself stays in the browser. Nothing renders.
 */
export default function CartSync() {
  const { user } = useAuth();
  const sent = useRef<string | null>(null); // what the server has (a signature of the lines)

  useEffect(() => {
    if (!user) { sent.current = null; return; }
    let busy = false;
    const lines = () => {
      try {
        const raw: unknown = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
        return (Array.isArray(raw) ? raw : []).filter((i: { variantId?: string; quantity?: number }) => i && typeof i.variantId === "string" && (i.quantity ?? 0) > 0)
          .map((i: { variantId: string; cuttingTypeId?: string | null; quantity: number; instruction?: string }) => ({ variantId: i.variantId, cuttingTypeId: i.cuttingTypeId ?? null, quantity: i.quantity, note: i.instruction ?? null }));
      } catch { return []; }
    };
    const push = async () => {
      if (busy) return;
      const l = lines();
      const sig = l.map((x) => `${x.variantId}|${x.cuttingTypeId ?? ""}|${x.quantity}|${x.note ?? ""}`).sort().join(",");
      if (sig === sent.current) return;
      busy = true;
      const ok = await saveCartAction(l);
      busy = false;
      if (ok) sent.current = sig;
    };
    void push();
    const timer = window.setInterval(() => void push(), 1500); // the cart is written by several screens: a quiet check is enough
    window.addEventListener("storage", push);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", push); };
  }, [user]);

  return null;
}
