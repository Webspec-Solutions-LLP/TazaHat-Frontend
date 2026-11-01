"use client";

import { useBackClose } from "@/lib/backLayers";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import type { CartItem } from "../cart/Cart";
import "./Variant.css";
import { dressingChargeRupees } from "@/lib/cartLine";
import { fallbackImage, isRemoteImage, shortName, type ApiProductDetail, type PackAvailability } from "@/lib/api";
import { getProductDetailAction } from "@/app/actions";
import PackAction, { firstOrderable, packStatus } from "@/components/availability/PackAction";

export type VariantOption = {
  label: string;
  amount: number;
  unit: string;
  price: number;
  originalPrice: number;
} & PackAvailability;

export type VariantProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  weight: string;
  variants?: VariantOption[];
};

interface VariantProps {
  product: VariantProduct;
  currency: string;
  onClose: () => void;
  onGoToCart: (item: CartItem) => void;
  /** read this city's shop instead of the visitor's (changing an order is done in the order's own city) */
  cityId?: string;
}

export default function Variant({ product, currency, onClose, onGoToCart, cityId }: VariantProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | null>(null);
  const titleId = useId();
  const variants = product.variants?.length
    ? product.variants
    : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const matchingIndex = variants.findIndex((variant) => variant.price === product.price);
    return firstOrderable(variants, matchingIndex >= 0 ? matchingIndex : 0);
  });
  const [quantity, setQuantity] = useState(1);
  // the product's own dressing types come from the backend (the same data as the product page); real ones must be chosen, "N/A" means none
  const [detail, setDetail] = useState<ApiProductDetail | null>(null);
  const [detailState, setDetailState] = useState<"loading" | "ready" | "failed">("loading");
  const [dressingId, setDressingId] = useState("");
  const [instruction, setInstruction] = useState("");
  const [dressingError, setDressingError] = useState(false);
  const dressingSelect = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    let cancelled = false;
    void getProductDetailAction(product.id, cityId).then(found => {
      if (cancelled) return;
      setDetail(found);
      setDetailState(found ? "ready" : "failed");
    });
    return () => { cancelled = true; };
  }, [product.id, cityId]);
  const dressing = detail?.cutting.find(c => c.id === dressingId);
  const isCustomDressing = !!dressing && /custom/i.test(dressing.name);
  const selectedPack = detail?.packs.find(pk => pk.label === (variants[selectedIndex] ?? variants[0]).label);
  const dressingCharge = dressing ? dressingChargeRupees(dressing.chargePaisa, selectedPack?.grams) : 0;
  const [isClosing, setIsClosing] = useState(false);
  const selected = variants[selectedIndex] ?? variants[0];
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 });
  const unitPrice = selected.amount > 0 ? selected.price / selected.amount : selected.price;
  const unitLabel = selected.unit === "kg" ? "kg" : selected.unit === "L" ? "L" : selected.unit;
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(onClose, 500);
  };
  useBackClose(handleClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const handleGoToCart = () => {
    // wait for the product's options; with real dressing types one has to be chosen first
    if (detailState === "loading") return;
    if (detail?.dressingRequired && !dressing) { setDressingError(true); dressingSelect.current?.focus(); return; }
    onGoToCart({
      // the same line id as the product page and the quick view use for this pack (+ dressing), so they never become two lines
      id: `${product.id}-${selected.label}${dressing ? `-${dressing.id}` : ""}`,
      name: product.name,
      image: product.image,
      price: selected.price + dressingCharge,
      originalPrice: selected.originalPrice + dressingCharge,
      slug: product.id, variantId: selectedPack?.id, packLabel: selected.label, cuttingTypeId: dressing?.id ?? null, dressingName: dressing ? shortName(dressing.name) : undefined, dressingCharge: dressing ? dressingCharge : undefined,
      instruction: isCustomDressing ? instruction.trim().slice(0, 200) || undefined : undefined,
      weight: `${selected.label}${dressing ? ` · ${shortName(dressing.name)}` : ""}${isCustomDressing && instruction.trim() ? ` · “${instruction.trim().slice(0, 60)}”` : ""}`,
      quantity,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className={`variant-dialog${isClosing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); handleClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) handleClose(); }}
    >
      <section className="variant-panel">
        <header className="variant-header">
          <div>
            <p className="variant-eyebrow">Choose your preferred size</p>
            <h2 id={titleId}>{product.name}</h2>
          </div>
          <button type="button" className="variant-close" aria-label="Close variant selection" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path className="variant-close-x" d="m7 7 10 10M17 7 7 17" />
              <path className="variant-close-chevron" d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </header>
        <div className="variant-product-summary">
          <div className="variant-product-image"><Image src={product.image} alt="" fill sizes="72px" unoptimized={isRemoteImage(product.image)} onError={fallbackImage} /></div>
          <div className="variant-selected-size"><span>Selected size</span><strong>{selected.label}</strong><small>{money.format(unitPrice)} / {unitLabel}</small></div>
          <strong className="variant-selected-price">{money.format((selected.price + dressingCharge) * quantity)}</strong>
        </div>
        <fieldset className="variant-options">
          <legend>Available sizes</legend>
          <div className="variant-option-list">
            {variants.map((variant, index) => (
              <div className={`variant-choice${selectedIndex === index ? " is-selected" : ""}`} key={`${product.id}-${variant.label}`} onClick={() => setSelectedIndex(index)}>
                <label className="variant-option">
                  <input type="radio" name={`variant-${product.id}`} checked={selectedIndex === index} onChange={() => setSelectedIndex(index)} />
                  <span className="variant-option-copy"><strong>{variant.label}</strong>{packStatus(variant) === "soon" ? <small>From {variant.availableFromLabel}</small> : packStatus(variant) === "out" && <small>Out of stock</small>}</span>
                </label>
                {selectedIndex === index && packStatus(variant) === "ok" && <div className="variant-choice-quantity">
                  <div className="variant-quantity" role="group" aria-label={`Quantity for ${variant.label}`}>
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(count => Math.max(1, count - 1))} disabled={quantity <= 1}>-</button>
                    <output aria-live="polite">{quantity}</output>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(count => Math.min(99, count + 1))} disabled={quantity >= 99}>+</button>
                  </div>
                </div>}
                <small className="variant-choice-price">{money.format(variant.price)}</small>
                <span className="variant-radio-mark" aria-hidden="true" />
              </div>
            ))}
          </div>
        </fieldset>
        {detailState === "loading" && <div className="sk variant-dressing-skeleton" role="status" aria-label="Loading dressing options" />}
        {detail && detail.cutting.length > 0 && (
          <label className={`variant-dressing-field${dressingError ? " has-error" : ""}`}>
            <span>Dressing Type{detail.dressingRequired ? <b className="variant-required" aria-hidden="true"> *</b> : null}</span>
            <select ref={dressingSelect} required={detail.dressingRequired} aria-invalid={dressingError || undefined} value={dressingId} onChange={event => { setDressingId(event.target.value); setInstruction(""); setDressingError(false); }}>
              <option value="">Select Dressing Type</option>
              {detail.cutting.map(c => <option key={c.id} value={c.id}>{c.name}{c.chargePaisa > 0 ? ` (+${money.format(c.chargePaisa / 100)})` : ""}</option>)}
            </select>
            {dressingError && <small className="variant-field-error" role="alert">Please choose a dressing type first.</small>}
          </label>
        )}
        {isCustomDressing && (
          <label className="variant-dressing-field">
            <span>Special instruction</span>
            <textarea rows={3} value={instruction} onChange={event => setInstruction(event.target.value)} placeholder="Tell us how you want it cut (e.g. 6 pieces, head removed...)" maxLength={250} />
          </label>
        )}
        <footer className="variant-footer">
          <PackAction pack={selected} className="variant-go-cart" onAdd={handleGoToCart}>
            <span className="variant-go-cart-label">Go to Cart</span>
            <small className="variant-go-cart-meta">{selected.label} x {quantity}</small>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></svg>
          </PackAction>
        </footer>
      </section>
    </dialog>
  );
}
