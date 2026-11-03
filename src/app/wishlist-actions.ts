"use server";

import { userApi } from "@/lib/server/session";

/** The wishlist (hearts) of the signed-in customer, kept on the server so the website and the app share it. */
export async function getWishlistAction(): Promise<{ slugs: string[] } | null> {
  const res = await userApi<{ slugs: string[] }>("/wishlist");
  return res.ok ? { slugs: res.data.slugs } : null;
}

export async function saveWishlistAction(slugs: string[]): Promise<{ slugs: string[] } | null> {
  const clean = [...new Set((Array.isArray(slugs) ? slugs : []).filter((s) => typeof s === "string" && /^[\w-]{1,160}$/.test(s)))].slice(0, 300);
  const res = await userApi<{ slugs: string[] }>("/wishlist", { method: "PUT", body: { slugs: clean } });
  return res.ok ? { slugs: res.data.slugs } : null;
}
