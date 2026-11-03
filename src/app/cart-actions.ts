"use server";

import { userApi } from "@/lib/server/session";

/** A copy of the signed-in customer's cart on the server (the working cart stays in the browser): the CRM's "User Carts" shows it. */
export async function saveCartAction(lines: { variantId: string; cuttingTypeId?: string | null; quantity: number; note?: string | null }[], clientId?: string): Promise<boolean> {
  const clean = (Array.isArray(lines) ? lines : []).slice(0, 100).filter((l) => l && typeof l.variantId === "string" && l.variantId.length <= 60).map((l) => ({
    variantId: l.variantId,
    cuttingTypeId: typeof l.cuttingTypeId === "string" && l.cuttingTypeId.length <= 60 ? l.cuttingTypeId : null,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(l.quantity)) || 1)),
    note: typeof l.note === "string" && l.note ? l.note.slice(0, 200) : null,
  }));
  const res = await userApi<unknown>("/cart", { method: "PUT", body: { lines: clean, clientId: typeof clientId === "string" ? clientId.slice(0, 60) : null } });
  return res.ok;
}

/** a cart line as the server sends it (with everything needed to show it) */
export interface RemoteCartLine { variantId: string; cuttingTypeId: string | null; quantity: number; note: string | null; slug: string | null; name: string; image: string | null; packLabel: string | null; unitPaisa: number; mrpUnitPaisa: number; dressingPaisa: number; dressingName: string | null }

/** the cart saved on the account (a new browser starts from it when its own cart is empty) */
export async function getCartAction(): Promise<RemoteCartLine[] | null> {
  const res = await userApi<{ lines: RemoteCartLine[] }>("/cart");
  return res.ok ? res.data.lines : null;
}
