"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import type { CartItem } from "../cart/Cart";
import "./Variant.css";
import { fallbackImage, isRemoteImage } from "@/lib/api";

export type VariantOption = {
  label: string;
  amount: number;
  unit: string;
  price: number;
  originalPrice: number;
};

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
}

export default function Variant({ product, currency, onClose, onGoToCart }: VariantProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | null>(null);
  const titleId = useId();
  const variants = product.variants?.length
    ? product.variants
    : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const matchingIndex = variants.findIndex((variant) => variant.price === product.price);
    return matchingIndex >= 0 ? matchingIndex : 0;
  });
  const [quantity, setQuantity] = useState(1);
  const [dressingType, setDressingType] = useState("");
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
    onGoToCart({
      id: `${product.id}-${selected.label.replace(/\s+/g, "-")}`,
      name: product.name,
      image: product.image,
      price: selected.price,
      originalPrice: selected.originalPrice,
      weight: selected.label,
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
          <strong className="variant-selected-price">{money.format(selected.price * quantity)}</strong>
        </div>
        <fieldset className="variant-options">
          <legend>Available sizes</legend>
          <div className="variant-option-list">
            {variants.map((variant, index) => (
              <div className={`variant-choice${selectedIndex === index ? " is-selected" : ""}`} key={`${product.id}-${variant.label}`} onClick={() => setSelectedIndex(index)}>
                <label className="variant-option">
                  <input type="radio" name={`variant-${product.id}`} checked={selectedIndex === index} onChange={() => setSelectedIndex(index)} />
                  <span className="variant-option-copy"><strong>{variant.label}</strong></span>
                </label>
                {selectedIndex === index && <div className="variant-choice-quantity">
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
        <label className="variant-dressing-field">
          <span>Dressing Type</span>
          <select value={dressingType} onChange={event => setDressingType(event.target.value)}>
            <option value="">Select Dressing Type</option>
            <option value="whole">Whole / Uncut</option>
            <option value="cleaned">Cleaned</option>
            <option value="curry-cut">Curry Cut</option>
          </select>
        </label>
        <footer className="variant-footer">
          <button type="button" className="variant-go-cart" onClick={handleGoToCart}>
            <span className="variant-go-cart-label">Go to Cart</span>
            <small className="variant-go-cart-meta">{selected.label} x {quantity}</small>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></svg>
          </button>
        </footer>
      </section>
    </dialog>
  );
}
