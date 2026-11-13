"use client";
import { createContext, useContext } from "react";
import { type Brand, getBrand, setBrand } from "./brandText";

export type { Brand };
const BrandCtx = createContext<Brand>(getBrand());

/** Wraps the site; also fills the language files' placeholders for everything rendered inside */
export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  setBrand(brand);
  return <BrandCtx.Provider value={brand}>{children}</BrandCtx.Provider>;
}
export const useBrand = () => useContext(BrandCtx);

/** The shop's name the way the header and footer write it: the last word (when there are several) in the highlight colour */
export function BrandWords({ name }: { name?: string }) {
  const b = useBrand();
  const n = name ?? b.name;
  const at = n.lastIndexOf(" ");
  return at > 0 ? <>{n.slice(0, at + 1)}<span>{n.slice(at + 1)}</span></> : <>{n}</>;
}
