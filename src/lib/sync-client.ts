import type { RemoteCartLine } from "@/app/cart-actions";

/** Browser side of /api/sync: the same copies the server actions used to make, without a page refresh (see app/api/sync). */
async function call<T>(kind: string, method: "GET" | "PUT", body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(`/api/sync/${kind}`, { method, headers: body === undefined ? undefined : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", credentials: "same-origin" });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: T };
    return json.ok ? (json.data ?? null) : null;
  } catch { return null; }
}

export type CartLineIn = { variantId: string; cuttingTypeId?: string | null; quantity: number; note?: string | null };
export const saveCartAction = async (lines: CartLineIn[], clientId?: string): Promise<boolean> => (await call("cart", "PUT", { lines, clientId })) !== null;
export const getCartAction = async (): Promise<RemoteCartLine[] | null> => (await call<{ lines: RemoteCartLine[] }>("cart", "GET"))?.lines ?? null;
export const getWishlistAction = async (): Promise<{ slugs: string[] } | null> => call<{ slugs: string[] }>("wishlist", "GET");
export const saveWishlistAction = async (slugs: string[]): Promise<{ slugs: string[] } | null> => call<{ slugs: string[] }>("wishlist", "PUT", { slugs });
export const getCompareAction = async (): Promise<{ slugs: string[] } | null> => call<{ slugs: string[] }>("compare", "GET");
export const saveCompareAction = async (slugs: string[]): Promise<{ slugs: string[] } | null> => call<{ slugs: string[] }>("compare", "PUT", { slugs });
