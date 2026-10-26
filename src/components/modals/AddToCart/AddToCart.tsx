"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./AddToCart.css";

type Product = {
  id: string;
  name: string;
  image: string;
  images?: string[];
  variants?: { label: string; amount: number; unit: string; price: number; originalPrice: number }[];
  price: number;
  originalPrice: number;
  weight: string;
  category: string;
  rating: number;
  reviews: number;
};

function DetailIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "arrow" ? <path d="m9 5 7 7-7 7" /> : kind === "heart" ? <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /> : kind === "cart" ? <><path d="M2 3h3l3 13h11l3-9H6" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></> : kind === "leaf" ? <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8" /></> : kind === "snow" ? <path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3" /> : kind === "shield" ? <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" /><path d="m8 12 3 3 5-6" /></> : <><path d="M9 3h6M10 3v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M8 14h8" /></>}
  </svg>;
}

export default function AddToCart({ product, locale, currency, saved, onToggleWishlist, onClose }: {
  product: Product;
  locale: string;
  currency: string;
  saved: boolean;
  onToggleWishlist: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
  const [variantIndex, setVariantIndex] = useState(() => Math.max(0, variants.findIndex(variant => variant.price === product.price)));
  const variant = variants[variantIndex] ?? variants[0];
  const imageSources = [...new Set([product.image, ...(product.images ?? [])])];
  const galleryImages = imageSources.length > 1
    ? imageSources.map((src, index) => ({ src, scale: 1, label: `Image ${index + 1}` }))
    : [
      { src: product.image, scale: 1, label: "Full view" },
      { src: product.image, scale: 1.3, label: "Close-up" },
      { src: product.image, scale: 1.65, label: "Detail" },
    ];
  const currentImage = galleryImages[activeImage] ?? galleryImages[0];
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const discount = variant.originalPrice > 0 ? Math.round((1 - variant.price / variant.originalPrice) * 100) : 0;
  const unitPrice = variant.price / variant.amount;
  const canDress = ["Fish & Seafood", "Meat & Poultry"].includes(product.category);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      // The trigger can be removed during a route transition; only restore
      // focus when it remains connected to the current document.
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  return (
    <dialog ref={dialog} className={`add-cart-dialog${closing ? " is-closing" : ""}`} aria-labelledby="add-cart-title" onCancel={event => { event.preventDefault(); setClosing(true); }} onClick={event => { if (event.target === event.currentTarget) setClosing(true); }}>
      <div className="add-cart-panel">
        <button autoFocus type="button" className="add-cart-close" aria-label="Close product details" onClick={() => setClosing(true)}><DetailIcon kind="arrow" /></button>
        <div className="add-cart-layout">
          <div className="add-cart-gallery">
            <div className="add-cart-photo" id="add-cart-main-image">
              <span className="add-cart-photo-badge"><DetailIcon kind="leaf" />Fresh picks</span>
              <Image src={currentImage.src} alt={`${product.name} — ${currentImage.label}`} fill sizes="(max-width: 760px) 80vw, 380px" style={{ transform: `scale(${currentImage.scale})` }} />
              <span className="add-cart-photo-count">{activeImage + 1} / {galleryImages.length}</span>
            </div>
            <div className="add-cart-thumbnails" role="group" aria-label="Product images">
              {galleryImages.map((item, index) => <button key={`${item.src}-${index}`} type="button" className="add-cart-thumbnail" aria-label={`Show ${item.label.toLowerCase()} of ${product.name}`} aria-pressed={activeImage === index} aria-controls="add-cart-main-image" onClick={() => setActiveImage(index)}>
                <span className="add-cart-thumbnail-image"><Image src={item.src} alt="" fill sizes="76px" style={{ transform: `scale(${item.scale})` }} /></span>
                <span>{item.label}</span>
              </button>)}
            </div>
            <p className="add-cart-image-caption"><DetailIcon kind="shield" />Freshness you can trust</p>
          </div>
          <div className="add-cart-details">
            <span className="add-cart-category">{product.category}</span>
            <h2 id="add-cart-title">{product.name}</h2>
            <p className="add-cart-rating"><span aria-hidden="true">★</span> {product.rating} <span>({product.reviews} Reviews)</span></p>
            {discount > 0 && <span className="add-cart-discount">{discount}% OFF</span>}
            <div className="add-cart-price" aria-live="polite" aria-atomic="true"><del>{money.format(variant.originalPrice)}</del><strong>{money.format(variant.price)}</strong><span>/ {variant.label}</span><small>{money.format(unitPrice)} / {variant.unit}</small></div>
            <div className="add-cart-benefits">
              {[{ icon: "leaf", label: "Fresh picks" }, { icon: "flask", label: "Quality first" }, { icon: "snow", label: "Handled with care" }, { icon: "shield", label: "Carefully packed" }].map(item => <div key={item.icon}><DetailIcon kind={item.icon} /><span>{item.label}</span></div>)}
            </div>
            <fieldset className="add-cart-variants">
              <legend>Weight / Pack size <span>{money.format(unitPrice)} / {variant.unit}</span></legend>
              <div className="add-cart-variant-grid">
                {variants.map((option, index) => <label key={option.label} className="add-cart-variant">
                  <input type="radio" name={`weight-${product.id}`} value={option.label} checked={variantIndex === index} onChange={() => setVariantIndex(index)} />
                  <span className="add-cart-variant-card"><span className="add-cart-variant-heading"><strong>{option.label}</strong><span className="add-cart-variant-check" aria-hidden="true">✓</span></span><strong className="add-cart-variant-price">{money.format(option.price)}</strong><small>{money.format(option.price / option.amount)} / {option.unit}</small></span>
                </label>)}
              </div>
            </fieldset>
            {canDress && <label className="add-cart-field">Dressing Type<select defaultValue=""><option value="">Select Dressing Type</option><option>Whole / Uncut</option><option>Cleaned</option><option>Curry Cut</option></select></label>}
            <label className="add-cart-field">Special instruction<input type="text" placeholder="Any preferences? (optional)" maxLength={250} /></label>
            <div className="add-cart-quantity"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(value => value - 1)}>−</button><output aria-live="polite" aria-label="Quantity">{quantity}</output><button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity(value => value + 1)}>+</button></div><strong aria-live="polite"><small>Total · {variant.label} × {quantity}</small>{money.format(variant.price * quantity)}</strong></div>
            <div className="add-cart-actions"><button type="button" className="add-cart-submit" onClick={() => setNotice("Online ordering is not available yet. Please confirm prices and availability before ordering.")}><DetailIcon kind="cart" />Add to Cart<DetailIcon kind="arrow" /></button><button type="button" className="add-cart-wishlist" aria-pressed={saved} onClick={onToggleWishlist}><DetailIcon kind="heart" />{saved ? "Wishlisted" : "Add to Wishlist"}</button></div>
            <p className="add-cart-notice" role="status">{notice || "Sample product details. Prices and availability are illustrative."}</p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
