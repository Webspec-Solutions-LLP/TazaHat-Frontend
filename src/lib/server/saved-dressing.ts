import "server-only";
import type { ApiProductDetail } from "../api";
import { userApi } from "./session";

/**
 * "Same as last time": for a signed-in customer, the dressing they chose before for this product comes first in its list, marked "(Same as last time)", with what
 * they wrote for a custom cut. A visitor who is not signed in (or any failure) gets the list as it is.
 */
export async function withSavedDressings(detail: ApiProductDetail | null | undefined): Promise<ApiProductDetail | null | undefined> {
  if (!detail || !detail.cutting?.length) return detail;
  try {
    const res = await userApi<{ saved: { cuttingTypeId: string; details: string }[] }>(`/dressings/${encodeURIComponent(detail.slug)}`);
    if (!res.ok || !res.data.saved.length) return detail;
    const mine = new Map(res.data.saved.map((s) => [s.cuttingTypeId, s.details]));
    const cutting = detail.cutting
      .map((c) => (mine.has(c.id) ? { ...c, name: `${c.name} (Same as last time)`, sameAsLast: true, details: mine.get(c.id) ?? "" } : c))
      .sort((a, b) => Number(!!b.sameAsLast) - Number(!!a.sameAsLast));
    return { ...detail, cutting };
  } catch {
    return detail;
  }
}
