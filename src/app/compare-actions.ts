"use server";

import { userApi } from "@/lib/server/session";

/** The compare list of the signed-in customer, kept on the server so the website and the app share it (server actions: tokens stay in cookies). */
export async function getCompareAction(): Promise<{ slugs: string[] } | null> {
  const res = await userApi<{ slugs: string[] }>("/compare");
  return res.ok ? { slugs: res.data.slugs } : null;
}

export async function saveCompareAction(slugs: string[]): Promise<{ slugs: string[] } | null> {
  const clean = [...new Set((Array.isArray(slugs) ? slugs : []).filter((s) => typeof s === "string" && /^[\w-]{1,160}$/.test(s)))].slice(0, 4);
  const res = await userApi<{ slugs: string[] }>("/compare", { method: "PUT", body: { slugs: clean } });
  return res.ok ? { slugs: res.data.slugs } : null;
}
