"use server";

import { readCityCookie } from "@/lib/server/city";
import { userApi } from "@/lib/server/session";

/** Checkout: what the city offers (dates, time slots, pickup stores, payment choices) and the server's price for the cart. Prices are never computed in the browser. */

export interface CheckoutOptions {
  dates: { date: string; label: string; short: string }[];
  slots: { id: string; name: string; time: string | null; chargePaisa: number }[];
  pickupStores: { id: string; name: string; areaName: string | null; pincode: string | null; phone: string }[];
  payments: { id: "COD" | "ONLINE"; label: string; enabled: boolean; note?: string }[];
  walletBalancePaisa: number;
}
export interface CheckoutLineInput { variantId: string; cuttingTypeId?: string | null; quantity: number; instruction?: string | null }
export interface CheckoutQuoteInput { lines: CheckoutLineInput[]; deliveryType: "HOME_DELIVERY" | "STORE_PICKUP"; addressId?: string | null; slotId?: string | null; useWallet?: boolean }
export interface QuoteLine {
  variantId: string; cuttingTypeId: string | null; quantity: number; instruction: string | null; name: string; slug: string | null; image: string | null;
  packLabel: string | null; grams: number | null; dressingName: string | null; unitPaisa: number; mrpUnitPaisa: number; dressingUnitPaisa: number; linePaisa: number; problem: string | null;
}
export interface CheckoutQuote {
  lines: QuoteLine[]; itemsPaisa: number; dressingPaisa: number; discountPaisa: number; deliveryPaisa: number; convenienceFeePaisa: number; slotFeePaisa: number;
  totalPaisa: number; walletBalancePaisa: number; walletUsedPaisa: number; payablePaisa: number; blockers: string[]; notes: string[];
}

export async function checkoutOptionsAction(): Promise<CheckoutOptions | null> {
  const city = await readCityCookie();
  if (!city) return null;
  const res = await userApi<CheckoutOptions>(`/checkout/options?cityId=${encodeURIComponent(city.id)}`);
  return res.ok ? res.data : null;
}

export async function checkoutQuoteAction(input: CheckoutQuoteInput): Promise<{ ok: true; quote: CheckoutQuote } | { ok: false; error: string }> {
  const city = await readCityCookie();
  if (!city) return { ok: false, error: "Choose your delivery city first." };
  const lines = (Array.isArray(input.lines) ? input.lines : []).slice(0, 100).map((l) => ({
    variantId: String(l.variantId).slice(0, 60), cuttingTypeId: l.cuttingTypeId ? String(l.cuttingTypeId).slice(0, 60) : null,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(l.quantity)) || 1)), instruction: l.instruction ? String(l.instruction).slice(0, 200) : null,
  }));
  if (!lines.length) return { ok: false, error: "Your cart is empty." };
  const res = await userApi<CheckoutQuote>("/checkout/quote", {
    method: "POST",
    body: { cityId: city.id, lines, deliveryType: input.deliveryType === "STORE_PICKUP" ? "STORE_PICKUP" : "HOME_DELIVERY", addressId: input.addressId ?? null, slotId: input.slotId ?? null, useWallet: !!input.useWallet },
  });
  return res.ok ? { ok: true, quote: res.data } : { ok: false, error: res.message };
}
