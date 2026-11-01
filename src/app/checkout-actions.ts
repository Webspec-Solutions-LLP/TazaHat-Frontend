"use server";

import { readCityCookie } from "@/lib/server/city";
import { userApi } from "@/lib/server/session";

/** Checkout: what the city offers (dates, time slots, pickup stores, payment choices) and the server's price for the cart. Prices are never computed in the browser. */

export interface CheckoutOptions {
  /** the city the customer is shopping in (the cookie): its addresses are listed first */
  cityId?: string;
  dates: { date: string; label: string; short: string }[];
  slots: { id: string; name: string; time: string | null; chargePaisa: number }[];
  pickupStores: { id: string; name: string; areaName: string | null; pincode: string | null; phone: string }[];
  payments: { id: "COD" | "ONLINE"; label: string; enabled: boolean; note?: string }[];
  walletBalancePaisa: number;
}
export interface CheckoutLineInput { variantId: string; cuttingTypeId?: string | null; quantity: number; instruction?: string | null }
export interface CheckoutQuoteInput { lines: CheckoutLineInput[]; deliveryType: "HOME_DELIVERY" | "STORE_PICKUP"; addressId?: string | null; storeId?: string | null; deliveryDate?: string | null; slotId?: string | null; useWallet?: boolean }
export type CheckoutPopup =
  | { type: "availability"; title: string; icon: "warning"; submittable: true; availability: { name: string; date: string | null; notes: string[] }[]; advance: { name: string; date: string; note: string }[] }
  | { type: "delivery"; title: string; icon: "info" | "success"; submittable: boolean; message: string };
export interface QuoteLine {
  variantId: string; cuttingTypeId: string | null; quantity: number; instruction: string | null; name: string; slug: string | null; image: string | null;
  packLabel: string | null; grams: number | null; dressingName: string | null; unitPaisa: number; mrpUnitPaisa: number; dressingUnitPaisa: number; linePaisa: number; problem: string | null;
}
export interface CheckoutQuote {
  lines: QuoteLine[]; itemsPaisa: number; dressingPaisa: number; discountPaisa: number; deliveryPaisa: number; convenienceFeePaisa: number; slotFeePaisa: number;
  totalPaisa: number; walletBalancePaisa: number; walletUsedPaisa: number; payablePaisa: number; blockers: string[]; notes: string[];
  slot: { id: string; name: string; time: string | null; chargePaisa: number } | null;
  popup: CheckoutPopup | null; today: { isToday: boolean; processingHours: number };
}

export async function checkoutOptionsAction(): Promise<CheckoutOptions | null> {
  const city = await readCityCookie();
  if (!city) return null;
  const res = await userApi<CheckoutOptions>(`/checkout/options?cityId=${encodeURIComponent(city.id)}`);
  return res.ok ? { ...res.data, cityId: city.id } : null;
}

/** what the order API is sent: the cart's lines and the choices made on the page (never prices) */
function orderBody(cityId: string, input: CheckoutQuoteInput) {
  const lines = (Array.isArray(input.lines) ? input.lines : []).slice(0, 100).map((l) => ({
    variantId: String(l.variantId).slice(0, 60), cuttingTypeId: l.cuttingTypeId ? String(l.cuttingTypeId).slice(0, 60) : null,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(l.quantity)) || 1)), instruction: l.instruction ? String(l.instruction).slice(0, 200) : null,
  }));
  return {
    cityId, lines, deliveryType: input.deliveryType === "STORE_PICKUP" ? "STORE_PICKUP" : "HOME_DELIVERY", addressId: input.addressId ?? null, storeId: input.storeId ?? null,
    deliveryDate: /^\d{4}-\d{2}-\d{2}$/.test(input.deliveryDate ?? "") ? input.deliveryDate : null, slotId: input.slotId ?? null, useWallet: !!input.useWallet,
  };
}

export async function checkoutQuoteAction(input: CheckoutQuoteInput): Promise<{ ok: true; quote: CheckoutQuote } | { ok: false; error: string }> {
  const city = await readCityCookie();
  if (!city) return { ok: false, error: "Choose your delivery city first." };
  const body = orderBody(city.id, input);
  if (!body.lines.length) return { ok: false, error: "Your cart is empty." };
  const res = await userApi<CheckoutQuote>("/checkout/quote", { method: "POST", body });
  return res.ok ? { ok: true, quote: res.data } : { ok: false, error: res.message };
}

/** Sends the order. The server prices it again and refuses anything the page should not have allowed. */
export async function placeOrderAction(input: CheckoutQuoteInput & { paymentMethod: "COD" | "ONLINE" }): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  const city = await readCityCookie();
  if (!city) return { ok: false, error: "Choose your delivery city first." };
  const body = orderBody(city.id, input);
  if (!body.lines.length) return { ok: false, error: "Your cart is empty." };
  const res = await userApi<{ orderNumber: string }>("/orders", { method: "POST", body: { ...body, paymentMethod: input.paymentMethod === "ONLINE" ? "ONLINE" : "COD" } });
  return res.ok ? { ok: true, orderNumber: res.data.orderNumber } : { ok: false, error: res.message };
}

export interface MyOrder {
  id: string; orderNumber: string; status: "PENDING" | "IN_PROGRESS" | "PROCESSING" | "PACKAGING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  placedAt: string; deliveryDate: string; deliverySlotName: string | null; deliverySlotLabel: string | null; deliveryType: string; paymentMethod: string;
  totalItem: number; estimatedTotalPaisa: number; billTotalPaisa: number; preview: { name: string; image: string | null; quantity: number; pack: string | null }[];
}

/** the signed-in customer's orders, newest first (30 at a time) */
export type OrderGroup = "all" | "upcoming" | "complete" | "cancel";

export async function myOrdersAction(page = 1, group: OrderGroup = "all"): Promise<{ orders: MyOrder[]; total: number; page: number; limit: number } | null> {
  const g: OrderGroup = group === "upcoming" || group === "complete" || group === "cancel" ? group : "all";
  const res = await userApi<{ orders: MyOrder[]; total: number; page: number; limit: number }>(`/orders?page=${Math.max(1, Math.floor(page) || 1)}&limit=30&group=${g}`);
  return res.ok ? res.data : null;
}

export interface MyOrderDetail {
  id: string; cityId: string | null; orderNumber: string; status: MyOrder["status"]; placedAt: string; deliveryDate: string | null; deliverySlotName: string | null; deliverySlotLabel: string | null;
  deliveryType: string; paymentMethod: string; paymentState: string; address: Record<string, string | number | null> | null; legacyAddressText: string | null;
  store: { name: string; areaName: string | null; pincode: string | null; phone: string } | null;
  editable: boolean; cancelMode: "direct" | "request" | null; cancelReason: string | null; paidPaisa: number;
  totals: { itemCount: number; deliveryFeePaisa: number; deliveryTimeFeePaisa: number; cuttingFeePaisa: number; convenienceFeePaisa: number; estimatedTotalPaisa: number; billTotalPaisa: number; adjustmentPaisa: number; discountPaisa: number; couponDiscountPaisa: number };
  items: { id: string; name: string; slug: string | null; image: string | null; weight: boolean; linePaisa: number; estimatedLinePaisa: number; packLabel: string | null; dressing: string | null; instruction: string | null; quantity: number; unitPricePaisa: number; dressingUnitPaisa: number; status: MyOrder["status"]; cancelled: boolean; orderedMeasurement: number; billedMeasurement: number; variantId: string | null; cuttingTypeId: string | null; cancelStatus: "NONE" | "PENDING" | "REJECTED" | "CONFIRMED"; cancelNote: string | null; canEdit: boolean; canCancel: boolean; finalLinePaisa: number | null }[];
}

export async function myOrderAction(ref: string): Promise<MyOrderDetail | null> {
  if (!/^[\w-]{1,60}$/.test(ref)) return null;
  const res = await userApi<MyOrderDetail>(`/orders/${encodeURIComponent(ref)}`);
  return res.ok ? res.data : null;
}

/** how many orders the customer has in each tab */
export async function myOrderCountsAction(): Promise<{ all: number; upcoming: number; complete: number; cancel: number; refund: number } | null> {
  const res = await userApi<{ all: number; upcoming: number; complete: number; cancel: number; refund: number }>("/orders/counts");
  return res.ok ? res.data : null;
}

export interface OrderEditInput {
  /** change an item: other size / dressing (null = none) / quantity / instruction */
  update?: { itemId: string; variantId?: string; cuttingTypeId?: string | null; quantity?: number; instruction?: string | null }[];
  setQuantity?: { itemId: string; quantity: number }[];
  remove?: string[];
  add?: { variantId: string; cuttingTypeId?: string | null; quantity: number; instruction?: string | null }[];
}

/** Change an order that has not been processed yet: quantities, removed items, added items. The server prices it again. */
export async function editOrderAction(ref: string, edit: OrderEditInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[\w-]{1,60}$/.test(ref)) return { ok: false, error: "Order not found" };
  const body = {
    update: (edit.update ?? []).slice(0, 100).map((u) => ({
      itemId: String(u.itemId).slice(0, 60), ...(u.variantId ? { variantId: String(u.variantId).slice(0, 60) } : {}),
      ...(u.cuttingTypeId !== undefined ? { cuttingTypeId: u.cuttingTypeId ? String(u.cuttingTypeId).slice(0, 60) : null } : {}),
      ...(u.quantity ? { quantity: Math.max(1, Math.min(99, Math.floor(Number(u.quantity)) || 1)) } : {}), ...(u.instruction !== undefined ? { instruction: u.instruction ? String(u.instruction).slice(0, 200) : null } : {}),
    })),
    setQuantity: (edit.setQuantity ?? []).slice(0, 100).map((q) => ({ itemId: String(q.itemId).slice(0, 60), quantity: Math.max(1, Math.min(99, Math.floor(Number(q.quantity)) || 1)) })),
    remove: (edit.remove ?? []).slice(0, 100).map((id) => String(id).slice(0, 60)),
    add: (edit.add ?? []).slice(0, 50).map((a) => ({
      variantId: String(a.variantId).slice(0, 60), cuttingTypeId: a.cuttingTypeId ? String(a.cuttingTypeId).slice(0, 60) : null,
      quantity: Math.max(1, Math.min(99, Math.floor(Number(a.quantity)) || 1)), instruction: a.instruction ? String(a.instruction).slice(0, 200) : null,
    })),
  };
  const res = await userApi<unknown>(`/orders/${encodeURIComponent(ref)}/items`, { method: "PATCH", body });
  return res.ok ? { ok: true } : { ok: false, error: res.message };
}

/** cancel the whole order; `requested` = the shop has started on it, so it is now a request for the shop to review */
export async function cancelOrderAction(ref: string, reason: string, details?: string): Promise<{ ok: true; requested: boolean } | { ok: false; error: string }> {
  if (!/^[\w-]{1,60}$/.test(ref)) return { ok: false, error: "Order not found" };
  const res = await userApi<{ requested: boolean }>(`/orders/${encodeURIComponent(ref)}/cancel`, { method: "POST", body: { reason: String(reason ?? "").slice(0, 200), details: details ? String(details).slice(0, 300) : null } });
  return res.ok ? { ok: true, requested: !!res.data.requested } : { ok: false, error: res.message };
}

export async function cancelOrderItemAction(ref: string, itemId: string, reason: string, details?: string): Promise<{ ok: true; requested: boolean } | { ok: false; error: string }> {
  if (!/^[\w-]{1,60}$/.test(ref) || !/^[\w-]{1,60}$/.test(itemId)) return { ok: false, error: "Order not found" };
  const res = await userApi<{ requested: boolean }>(`/orders/${encodeURIComponent(ref)}/items/${encodeURIComponent(itemId)}/cancel`, { method: "POST", body: { reason: String(reason ?? "").slice(0, 200), details: details ? String(details).slice(0, 300) : null } });
  return res.ok ? { ok: true, requested: !!res.data.requested } : { ok: false, error: res.message };
}
