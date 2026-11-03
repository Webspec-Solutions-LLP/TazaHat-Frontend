"use server";

import { userApi } from "@/lib/server/session";

/** A copy of the signed-in customer's cart on the server (the working cart stays in the browser): the CRM's "User Carts" shows it. */
export async function saveCartAction(lines: { variantId: string; cuttingTypeId?: string | null; quantity: number; note?: string | null }[]): Promise<boolean> {
  const clean = (Array.isArray(lines) ? lines : []).slice(0, 100).filter((l) => l && typeof l.variantId === "string" && l.variantId.length <= 60).map((l) => ({
    variantId: l.variantId,
    cuttingTypeId: typeof l.cuttingTypeId === "string" && l.cuttingTypeId.length <= 60 ? l.cuttingTypeId : null,
    quantity: Math.max(1, Math.min(99, Math.floor(Number(l.quantity)) || 1)),
    note: typeof l.note === "string" && l.note ? l.note.slice(0, 200) : null,
  }));
  const res = await userApi<unknown>("/cart", { method: "PUT", body: { lines: clean } });
  return res.ok;
}
