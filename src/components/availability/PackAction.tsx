"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import type { PackAvailability } from "@/lib/api";
import "./PackAction.css";

/**
 * What the buy button of a pack shows:
 *   ok    -> the normal button (Add to Cart)
 *   soon  -> the pack is not on sale yet: "Available from Tuesday" (no button to press, no pre-order for now)
 *   out   -> sold out: "Notify me" (asks for a login first, then tells the customer when it is back)
 */
export type PackStatus = "ok" | "soon" | "out";

export function packStatus(pack?: PackAvailability | null): PackStatus {
  if (pack?.availableFromLabel) return "soon";
  return pack && pack.inStock === false ? "out" : "ok";
}

/** the pack to preselect: the one that matches `wantedIndex` when it can be ordered, else the first that can, else `wantedIndex` */
export function firstOrderable(packs: PackAvailability[], wantedIndex: number): number {
  if (packStatus(packs[wantedIndex]) === "ok") return wantedIndex;
  const found = packs.findIndex((p) => packStatus(p) === "ok");
  return found >= 0 ? found : wantedIndex;
}

const BellIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>;

/** On the picture of a card: "Out of stock" (the picture fades) or "Coming soon" when the pack is not on sale yet; nothing when it can be ordered. */
export function StockRibbon({ pack }: { pack?: PackAvailability | null }) {
  const status = packStatus(pack);
  if (status === "ok") return null;
  return <span className={`stock-ribbon stock-ribbon--${status}`}>{status === "out" ? "Out of stock" : "Coming soon"}</span>;
}

export function AvailableFromButton({ label, className = "" }: { label: string; className?: string }) {
  return <button type="button" className={`${className} pack-action pack-action--soon`} disabled><CalendarIcon />Available from {label}</button>;
}

export function NotifyMeButton({ variantId, className = "" }: { variantId?: string; className?: string }) {
  const { waiting, requestNotify, cancelNotify } = useAuth();
  if (!variantId) return <button type="button" className={`${className} pack-action pack-action--out`} disabled>Out of stock</button>;
  const isWaiting = waiting.has(variantId);
  return isWaiting ? (
    <button type="button" className={`${className} pack-action pack-action--waiting`} title="You will be notified. Tap to cancel." aria-pressed="true" onClick={() => void cancelNotify([variantId])}><CheckIcon />We&apos;ll notify you</button>
  ) : (
    <button type="button" className={`${className} pack-action pack-action--notify`} onClick={() => void requestNotify([variantId])}><BellIcon />Notify me</button>
  );
}

/** the buy control for one pack: `children` is the normal button content, `onAdd` what it does */
export default function PackAction({ pack, className = "", onAdd, children }: { pack?: PackAvailability | null; className?: string; onAdd: () => void; children: ReactNode }) {
  const status = packStatus(pack);
  if (status === "soon") return <AvailableFromButton label={pack!.availableFromLabel!} className={className} />;
  if (status === "out") return <NotifyMeButton variantId={pack?.id} className={className} />;
  return <button className={className} type="button" onClick={onAdd}>{children}</button>;
}
