"use client";

import { placeholderImage } from "@/lib/brandText";
import { useBackClose } from "@/lib/backLayers";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getProductDetailAction } from "@/app/actions";
import { fallbackImage, isRemoteImage, mediaSrc, shortName, type ApiProductDetail } from "@/lib/api";
import type { CompareProduct } from "../compareList/CompareList";
import "./CompareDetails.css";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export interface CompareDetailsProps {
  products: CompareProduct[];
  onClose: () => void;
  onBackToList?: () => void;
}

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const toNumber = (val?: number | string): number => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
};

/** what one side of the comparison is: the product as it was added to the compare list, plus its live data from the shop (undefined = still loading, null = not available) */
type Detail = ApiProductDetail | null | undefined;
type Availability = "ok" | "soon" | "out" | "unknown";

function describe(p: CompareProduct, detail: Detail, t: typeof englishText) {
  const price = toNumber(p.price);
  const original = toNumber(p.originalPrice);
  const packs = detail?.packs ?? [];
  const orderable = packs.filter(x => x.inStock);
  const upcoming = packs.find(x => x.availableFromLabel);
  // the pack to add to the cart: the one that was compared if it can be ordered, else the first that can
  const pack = orderable.find(x => x.label === p.unit) ?? orderable[0];
  const availability: Availability = !detail ? "unknown" : orderable.length ? "ok" : upcoming ? "soon" : "out";
  const availabilityText = detail === undefined ? t.loading : !detail ? t.dash
    : !packs.length ? t.notSold
    : orderable.length ? t.inStockCount.replace("{available}", String(orderable.length)).replace("{total}", String(packs.length)).replace("{unit}", packs.length === 1 ? t.sizeSingle : t.sizePlural)
    : upcoming ? t.availableFrom.replace("{date}", upcoming.availableFromLabel ?? "") : t.outOfStock;
  const startingPrice = packs.length ? Math.min(...packs.map(x => Math.round(x.pricePaisa / 100))) : null;
  const perKg = detail?.ratePerKgPaisa ? Math.round(detail.ratePerKgPaisa / 100) : null;
  return {
    price, original, packs, pack, availability, dressingRequired: !!detail?.dressingRequired, availabilityText, startingPrice, perKg,
    unit: p.unit || "",
    saving: original > price ? original - price : 0,
    savingPct: original > price ? Math.round((1 - price / original) * 100) : 0,
    category: detail ? `${shortName(detail.category.name)} › ${shortName(detail.subCategory.name)}` : detail === undefined ? t.loading : t.dash,
    sizes: detail ? (packs.length ? packs.map(x => x.label).join(", ") : t.dash) : detail === undefined ? t.loading : t.dash,
    dressing: detail ? (detail.cutting.length ? t.dressingOptions.replace("{count}", String(detail.cutting.length)).replace("{unit}", detail.cutting.length === 1 ? t.optionSingle : t.optionPlural) : t.dressingNone) : detail === undefined ? t.loading : t.dash,
    image: detail?.images?.[0] ? mediaSrc(detail.images[0]) : p.image || placeholderImage(),
    rating: Number(p.rating ?? 0),
    reviews: p.reviews ?? 0,
  };
}
type Side = ReturnType<typeof describe>;

interface Row { key: string; label: string; a: ReactNode; b: ReactNode; textA: string; textB: string; winner?: "A" | "B" | null; tag?: string }

export default function CompareDetails({ products, onClose, onBackToList }: CompareDetailsProps) {
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;

  const [isClosing, setIsClosing] = useState(false);
  const [addedA, setAddedA] = useState(false);
  const [addedB, setAddedB] = useState(false);
  const [onlyDifferent, setOnlyDifferent] = useState(false);
  const titleId = useId();

  const productA = products[0];
  const productB = products[1];

  // the live data of both products (the same data as their product pages)
  const [detailA, setDetailA] = useState<Detail>(undefined);
  const [detailB, setDetailB] = useState<Detail>(undefined);
  useEffect(() => {
    let cancelled = false;
    if (productA) void getProductDetailAction(productA.id).then(d => { if (!cancelled) setDetailA(d); });
    if (productB) void getProductDetailAction(productB.id).then(d => { if (!cancelled) setDetailB(d); });
    return () => { cancelled = true; };
  }, [productA, productB]);

  const closeWithAnimation = useCallback(
    (callback?: () => void) => {
      if (isClosing) return;
      setIsClosing(true);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        if (callback) callback();
        else onClose();
      }, reduceMotion ? 0 : 220);
    },
    [isClosing, onClose]
  );
  useBackClose(() => closeWithAnimation());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWithAnimation();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWithAnimation]);

  if (!productA || !productB) return null;

  const a = describe(productA, detailA, t);
  const b = describe(productB, detailB, t);
  const nameA = shortName(productA.name);
  const nameB = shortName(productB.name);
  const lower = (x: number | null, y: number | null): "A" | "B" | null => (x === null || y === null || x === y ? null : x < y ? "A" : "B");
  const higher = (x: number, y: number): "A" | "B" | null => (x === y ? null : x > y ? "A" : "B");

  const startWinner = lower(a.startingPrice, b.startingPrice);
  const kgWinner = lower(a.perKg, b.perKg);
  const saveWinner = a.savingPct && b.savingPct ? higher(a.savingPct, b.savingPct) : a.savingPct || b.savingPct ? (a.savingPct ? "A" : "B") : null;
  const sizeWinner = detailA && detailB ? higher(a.packs.length, b.packs.length) : null;
  const availRank: Record<Availability, number> = { ok: 3, soon: 2, out: 1, unknown: 0 };
  const availWinner = a.availability !== "unknown" && b.availability !== "unknown" ? higher(availRank[a.availability], availRank[b.availability]) : null;

  const rows: Row[] = [
    { key: "category", label: t.rowCategory, a: a.category, b: b.category, textA: a.category, textB: b.category },
    {
      key: "pack", label: t.rowPack,
      a: `${money(a.price)}${a.unit ? ` · ${a.unit}` : ""}`, b: `${money(b.price)}${b.unit ? ` · ${b.unit}` : ""}`,
      textA: `${a.price}|${a.unit}`, textB: `${b.price}|${b.unit}`,
    },
    {
      key: "start", label: t.rowStart, a: a.startingPrice === null ? a.sizes === t.loading ? t.loading : t.dash : money(a.startingPrice), b: b.startingPrice === null ? b.sizes === t.loading ? t.loading : t.dash : money(b.startingPrice),
      textA: String(a.startingPrice), textB: String(b.startingPrice), winner: startWinner, tag: t.tagCheaper,
    },
    ...(a.perKg !== null || b.perKg !== null ? [{
      key: "kg", label: t.rowKg, a: a.perKg === null ? t.dash : money(a.perKg), b: b.perKg === null ? t.dash : money(b.perKg), textA: String(a.perKg), textB: String(b.perKg), winner: kgWinner, tag: t.tagCheaperPerKg,
    } as Row] : []),
    {
      key: "save", label: t.rowSave, a: a.saving ? t.savePercentOff.replace("{amount}", money(a.saving)).replace("{percent}", String(a.savingPct)) : t.noDiscount, b: b.saving ? t.savePercentOff.replace("{amount}", money(b.saving)).replace("{percent}", String(b.savingPct)) : t.noDiscount,
      textA: String(a.savingPct), textB: String(b.savingPct), winner: saveWinner, tag: t.tagBiggerSaving,
    },
    { key: "sizes", label: t.rowSizes, a: a.sizes, b: b.sizes, textA: a.sizes, textB: b.sizes, winner: sizeWinner, tag: t.tagMoreSizes },
    { key: "avail", label: t.rowAvail, a: a.availabilityText, b: b.availabilityText, textA: a.availabilityText, textB: b.availabilityText, winner: availWinner, tag: t.tagAvailable },
    { key: "dress", label: t.rowDress, a: a.dressing, b: b.dressing, textA: a.dressing, textB: b.dressing },
    ...(a.rating > 0 || b.rating > 0 ? [{
      key: "rating", label: t.rowRating, a: a.rating > 0 ? t.customerRatingText.replace("{rating}", a.rating.toFixed(1)).replace("{reviews}", String(a.reviews)) : t.noRatingsYet, b: b.rating > 0 ? t.customerRatingText.replace("{rating}", b.rating.toFixed(1)).replace("{reviews}", String(b.reviews)) : t.noRatingsYet,
      textA: String(a.rating), textB: String(b.rating), winner: higher(a.rating, b.rating), tag: t.tagHigherRated,
    } as Row] : []),
  ];
  const shownRows = onlyDifferent ? rows.filter(r => r.textA !== r.textB) : rows;
  const differing = rows.filter(r => r.textA !== r.textB).length;

  // the main differences, in a sentence each
  const glance: string[] = [];
  if (startWinner && a.startingPrice !== null && b.startingPrice !== null) glance.push(t.glanceStartsCheaper.replace("{name}", startWinner === "A" ? nameA : nameB).replace("{amount}", money(Math.abs(a.startingPrice - b.startingPrice))));
  if (kgWinner && a.perKg !== null && b.perKg !== null) glance.push(t.glanceCheaperPerKg.replace("{name}", kgWinner === "A" ? nameA : nameB).replace("{amount}", money(Math.abs(a.perKg - b.perKg))));
  if (sizeWinner) glance.push(t.glanceMoreSizes.replace("{name}", sizeWinner === "A" ? nameA : nameB).replace("{max}", String(Math.max(a.packs.length, b.packs.length))).replace("{min}", String(Math.min(a.packs.length, b.packs.length))));
  if (availWinner) glance.push((availWinner === "A" ? b : a).availability === "soon" ? t.glanceNotOnSale.replace("{name}", availWinner === "A" ? nameB : nameA) : t.glanceOutOfStock.replace("{name}", availWinner === "A" ? nameB : nameA));

  const addToCart = (p: CompareProduct, side: Side, which: "A" | "B") => {
    // with the live data: the compared pack (or the first one that can be ordered), at its real price; without it: as it was compared
    const item = side.pack
      ? { id: `${p.id}-${side.pack.label}`, name: shortName(p.name), image: side.image, price: Math.round(side.pack.pricePaisa / 100), originalPrice: Math.round(side.pack.mrpPaisa / 100), weight: side.pack.label, quantity: 1 }
      : { id: p.id, name: p.name, image: p.image, price: side.price, originalPrice: side.original > side.price ? side.original : undefined, weight: p.unit || "1 pack", quantity: 1 };
    window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
    if (which === "A") { setAddedA(true); setTimeout(() => setAddedA(false), 1600); }
    else { setAddedB(true); setTimeout(() => setAddedB(false), 1600); }
  };

  const card = (p: CompareProduct, side: Side, other: Side, which: "A" | "B", added: boolean) => {
    const cheaper = side.startingPrice !== null && other.startingPrice !== null ? side.startingPrice < other.startingPrice : !other.unit || side.unit === other.unit ? side.price < other.price : false;
    const blocked = side.availability === "out" || side.availability === "soon";
    // real dressing types have to be chosen on the product page, so it cannot be added from here
    const chooseFirst = side.dressingRequired && !blocked;
    return (
      <div className="compare-product-card">
        <div className="compare-product-img-wrap">
          <Image src={side.image} alt={p.name} fill sizes="160px" unoptimized={isRemoteImage(side.image)} onError={fallbackImage} className="compare-product-single-img" />
          {side.saving > 0 && <span className="compare-badge-savings">{t.saveAmount.replace("{amount}", money(side.saving))}</span>}
        </div>
        <h3 className="compare-product-title" title={p.name}>{p.name}</h3>
        {side.rating > 0 && (
          <div className="compare-rating-pill">
            <span className="compare-star">★</span><strong>{side.rating.toFixed(1)}</strong><span>{t.reviewsCount.replace("{count}", String(side.reviews))}</span>
          </div>
        )}
        <div className="compare-price-pill">
          <strong className="compare-main-price">{money(side.price)}</strong>
          {side.original > side.price && <del>{money(side.original)}</del>}
          {side.unit && <span className="compare-pack-unit">{t.perUnit.replace("{unit}", side.unit)}</span>}
          {cheaper && <span className="compare-value-pill">{t.betterPrice}</span>}
        </div>
        {side.availability !== "unknown" && <span className={`compare-avail compare-avail--${side.availability}`}>{side.availabilityText}</span>}
        <div className="compare-card-actions">
          {chooseFirst ? (
            <Link href={`/${encodeURIComponent(p.id)}`} className="compare-cart-btn compare-cart-btn--choose" onClick={() => closeWithAnimation()} title={t.chooseDressingTitle}>{t.chooseDressing}</Link>
          ) : (
            <button type="button" className={`compare-cart-btn${added ? " is-added" : ""}`} disabled={blocked} onClick={() => addToCart(p, side, which)}>
              {added ? <>✓ {t.added}</> : side.availability === "out" ? <>{t.outOfStock}</> : side.availability === "soon" ? <>{t.availableFrom.replace("{date}", side.packs.find(x => x.availableFromLabel)?.availableFromLabel ?? "")}</> : <>{t.addToCart}</>}
            </button>
          )}
          <Link href={`/${encodeURIComponent(p.id)}`} className="compare-view-link" onClick={() => closeWithAnimation()}>{t.viewDetails}</Link>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`compare-details-backdrop${isClosing ? " is-closing" : ""}`}
      onClick={event => { if (event.target === event.currentTarget) closeWithAnimation(); }}
      role="presentation"
    >
      <div className="compare-details-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} lang={t.language}>
        <header className="compare-details-header">
          <div className="compare-details-header-title">
            <span className="compare-details-header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" /></svg>
            </span>
            <div>
              <div className="compare-details-title-row">
                <h2 id={titleId}>{t.compareTitle}</h2>
                <span className="compare-details-count-pill">{t.itemsCount}</span>
              </div>
              <p>{t.subtitle}</p>
            </div>
          </div>
          <button type="button" className="compare-details-close" onClick={() => closeWithAnimation()} aria-label={t.closeAria}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </header>

        <div className="compare-details-body">
          <div className="compare-products-grid">
            {card(productA, a, b, "A", addedA)}
            <div className="compare-vs-divider" aria-hidden="true"><span className="compare-vs-badge">VS</span></div>
            {card(productB, b, a, "B", addedB)}
          </div>

          {glance.length > 0 && (
            <ul className="compare-glance" aria-label={t.mainDifferencesAria}>
              {glance.map(line => <li key={line}>{line}</li>)}
            </ul>
          )}

          <section className="compare-table-section">
            <div className="compare-table-header-bar">
              <h4 className="compare-table-heading">{t.tableHeading}</h4>
              <label className="compare-only-diff">
                <input type="checkbox" checked={onlyDifferent} onChange={event => setOnlyDifferent(event.target.checked)} />
                <span>{t.showOnlyDifferences.replace("{count}", String(differing))}</span>
              </label>
            </div>
            <div className="compare-table">
              <div className="compare-table-row compare-table-col-header">
                <span className="compare-col-label">{t.colAttribute}</span>
                <span className="compare-col-val compare-header-val" title={productA.name}>{nameA}</span>
                <span className="compare-col-val compare-header-val" title={productB.name}>{nameB}</span>
              </div>
              {shownRows.map(r => (
                <div className="compare-table-row" key={r.key}>
                  <span className="compare-col-label">{r.label}</span>
                  <span className={`compare-col-val${r.winner === "A" ? " is-winner" : ""}`}>{r.a}{r.winner === "A" && <span className="compare-cell-tag">{r.tag}</span>}</span>
                  <span className={`compare-col-val${r.winner === "B" ? " is-winner" : ""}`}>{r.b}{r.winner === "B" && <span className="compare-cell-tag">{r.tag}</span>}</span>
                </div>
              ))}
              {shownRows.length === 0 && <p className="compare-same-note">{t.sameNote}</p>}
            </div>
            <p className="compare-table-foot">{t.tableFoot}</p>
          </section>
        </div>

        <footer className="compare-details-footer">
          {onBackToList && (
            <button type="button" className="compare-details-back-btn" onClick={() => closeWithAnimation(onBackToList)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              {t.backToList}
            </button>
          )}
          <button type="button" className="compare-details-done-btn" onClick={() => closeWithAnimation()}>{t.closeButton}</button>
        </footer>
      </div>
    </div>
  );
}
