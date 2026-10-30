import "server-only";
import { cache } from "react";
import type { ShopHome } from "../api";
import { getShopHome, getShopProducts, type ShopProductPage } from "./api";

/** The home data of one city, fetched once per request even though several sections (each in its own <Suspense>) ask for it. */
export const loadHome = cache(async (cityId: string): Promise<{ data: ShopHome } | { error: string }> => {
  try {
    return { data: await getShopHome(cityId) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not load products." };
  }
});

export const loadFirstPage = cache(async (cityId: string): Promise<ShopProductPage | null> => getShopProducts(cityId, 1, 10).catch(() => null));
