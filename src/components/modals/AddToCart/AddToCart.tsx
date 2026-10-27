"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import type { CartItem } from "../cart/Cart";
import "swiper/css";
import catalog from "../../products/english.json";
import "./AddToCart.css";

type Product = (typeof catalog.products)[number];

function DetailIcon({ kind }: { kind: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "arrow" ? <path d="m9 5 7 7-7 7" /> : kind === "heart" ? <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /> : kind === "cart" ? <><path d="M2 3h3l3 13h11l3-9H6" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></> : kind === "leaf" ? <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8" /></> : kind === "snow" ? <path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3" /> : kind === "shield" ? <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" /><path d="m8 12 3 3 5-6" /></> : kind === "info" ? <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></> : <><path d="M9 3h6M10 3v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M8 14h8" /></>}
  </svg>;
}

export default function AddToCart({ product, locale, currency, saved, onToggleWishlist, onClose, onOpenProduct, onAddToCart, onUpdateCartQuantity }: {
  product: Product;
  locale: string;
  currency: string;
  saved: boolean;
  onToggleWishlist: () => void;
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
  onAddToCart?: (item: CartItem) => void;
  onUpdateCartQuantity?: (itemId: string, delta: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const descriptionRef = useRef<HTMLElement>(null);
  const [closing, setClosing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedVariantIndexes, setRelatedVariantIndexes] = useState<Record<string, number>>({});
  const [relatedSaved, setRelatedSaved] = useState<string[]>([]);
  const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
  const [variantIndex, setVariantIndex] = useState(() => Math.max(0, variants.findIndex(variant => variant.price === product.price)));
  const variant = variants[variantIndex] ?? variants[0];
  const imageSources = [product.image];
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
  const selectedPrice = variant.price * quantity;
  const selectedOriginalPrice = variant.originalPrice * quantity;
  const relatedProducts = catalog.products.filter(item => item.id !== product.id && item.category === product.category);
  const relatedMoney = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const cartItemId = `${product.id}-${variant.label}`;
  const isAddedToCart = addedVariantId === cartItemId;
  const handleAddToCart = () => {
    onAddToCart?.({
      id: cartItemId,
      name: product.name,
      image: product.image,
      price: variant.price,
      originalPrice: variant.originalPrice,
      weight: variant.label,
      quantity: 1,
    });
    setQuantity(1);
    setAddedVariantId(cartItemId);
  };

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
            <section className="add-cart-gallery-promise" aria-label="TazaHat quality promise">
              <span className="add-cart-gallery-promise-icon"><DetailIcon kind="shield" /></span>
              <span><strong>Freshness, checked daily</strong><small>Selected with care and packed to order.</small></span>
              <span className="add-cart-gallery-promise-check" aria-hidden="true">✓</span>
            </section>
          </div>
          <div className="add-cart-details">
            <span className="add-cart-category">{product.category}</span>
            <h2 id="add-cart-title">{product.name}</h2>
            <p className="add-cart-rating"><span aria-hidden="true">★</span> {product.rating} <span>({product.reviews} Reviews)</span></p>
            {discount > 0 && <span className="add-cart-discount">{discount}% OFF</span>}
            <div className="add-cart-price" aria-live="polite" aria-atomic="true"><del>{money.format(selectedOriginalPrice)}</del><strong>{money.format(selectedPrice)}</strong><span>/ {variant.label} × {quantity}</span><small>{money.format(unitPrice)} / {variant.unit}</small></div>
            <div className="add-cart-benefits">
              {[{ icon: "leaf", label: "Fresh picks" }, { icon: "flask", label: "Quality first" }, { icon: "snow", label: "Handled with care" }, { icon: "shield", label: "Carefully packed" }].map(item => <div key={item.icon}><DetailIcon kind={item.icon} /><span>{item.label}</span></div>)}
            </div>
            <fieldset className="add-cart-variants">
              <legend>Weight / Pack size</legend>
              <div className="add-cart-variant-grid">
                {variants.map((option, index) => <label key={option.label} className="add-cart-variant">
                  <input type="radio" name={`weight-${product.id}`} value={option.label} checked={variantIndex === index} onChange={() => { setVariantIndex(index); setQuantity(1); }} />
                  <span className="add-cart-variant-card"><span className="add-cart-variant-heading"><strong>{option.label}</strong><span className="add-cart-variant-check" aria-hidden="true">✓</span></span></span>
                </label>)}
              </div>
            </fieldset>
            <label className="add-cart-field">Dressing Type<select defaultValue=""><option value="">Select Dressing Type</option><option>Whole / Uncut</option><option>Cleaned</option><option>Curry Cut</option></select></label>
            <label className="add-cart-field">Special instruction<input type="text" placeholder="Any preferences? (optional)" maxLength={250} /></label>
            <div className="add-cart-actions">
              {isAddedToCart ? (
                <div className="add-cart-quantity">
                  <div>
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => {
                        onUpdateCartQuantity?.(cartItemId, -1);
                        if (quantity <= 1) {
                          setAddedVariantId(null);
                          setQuantity(1);
                        } else {
                          setQuantity(value => value - 1);
                        }
                      }}
                    >
                      −
                    </button>
                    <output aria-live="polite" aria-label="Quantity">{quantity}</output>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={quantity >= 99}
                      onClick={() => {
                        onUpdateCartQuantity?.(cartItemId, 1);
                        setQuantity(value => value + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                onAddToCart && (
                  <button type="button" className="add-cart-submit" onClick={handleAddToCart}>
                    <DetailIcon kind="cart" />Add to Cart
                  </button>
                )
              )}
              <button type="button" className="add-cart-wishlist" aria-pressed={saved} onClick={onToggleWishlist}><DetailIcon kind="heart" />{saved ? "Wishlisted" : "Add to Wishlist"}</button>
              <button type="button" className="add-cart-info" aria-controls="add-cart-description" onClick={() => descriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><DetailIcon kind="info" />Info</button>
            </div>
            <section ref={descriptionRef} id="add-cart-description" className="add-cart-description" aria-labelledby="add-cart-description-title">
              <h3 id="add-cart-description-title">Description</h3>
              <p>{product.name} is a quality pick from our {product.category.toLowerCase()} range, selected for your everyday meals.</p>
            </section>
          </div>
        </div>
        <section className="add-cart-related" aria-labelledby="add-cart-related-title">
          <h2 id="add-cart-related-title">Related Products</h2>
          <Swiper
            className="add-cart-related-slider"
            modules={[A11y, Keyboard, Mousewheel]}
            slidesPerView={2.1}
            spaceBetween={12}
            breakpoints={{ 601: { slidesPerView: 2.5, spaceBetween: 14 }, 1024: { slidesPerView: 3.1, spaceBetween: 16 } }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            mousewheel={{ forceToAxis: true }}
            a11y={{ containerMessage: "Related products. Swipe or use arrow keys to explore." }}
            tabIndex={0}
          >
            {relatedProducts.map(related => {
              const relatedVariants = related.variants?.length ? related.variants : [{ label: related.weight, amount: 1, unit: "pack", price: related.price, originalPrice: related.originalPrice }];
              const variantIndex = relatedVariantIndexes[related.id] ?? Math.max(0, relatedVariants.findIndex(option => option.price === related.price));
              const relatedVariant = relatedVariants[variantIndex] ?? relatedVariants[0];
              const relatedDiscount = relatedVariant.originalPrice > 0 ? Math.max(0, Math.round((1 - relatedVariant.price / relatedVariant.originalPrice) * 100)) : 0;
              const isRelatedSaved = relatedSaved.includes(related.id);
              const description = `${related.name} selected for freshness and quality, ready for your everyday meals.`;
              return (
                <SwiperSlide key={related.id}>
                  <article className="add-cart-related-card">
                    <div className="add-cart-related-image">
                      <Image src={related.image} alt={related.name} fill sizes="(max-width: 600px) 42vw, 220px" />
                      {relatedDiscount > 0 && <span className="add-cart-related-discount">{relatedDiscount}% OFF</span>}
                      <button type="button" className="add-cart-related-save" aria-label={`${isRelatedSaved ? "Remove" : "Save"} ${related.name} ${isRelatedSaved ? "from" : "to"} wishlist`} aria-pressed={isRelatedSaved} onClick={() => setRelatedSaved(current => isRelatedSaved ? current.filter(id => id !== related.id) : [...current, related.id])}>
                        <DetailIcon kind="heart" />
                      </button>
                      <span className="add-cart-related-rating">★ {related.rating}</span>
                    </div>
                    <h3><Link href={`/productDetails?id=${encodeURIComponent(related.id)}`}>{related.name}</Link></h3>
                    <p className="add-cart-related-description" title={description}>{description}</p>
                    <div className="add-cart-related-prices"><strong>{relatedMoney.format(relatedVariant.price)}</strong><del>{relatedMoney.format(relatedVariant.originalPrice)}</del></div>
                    <label className="add-cart-related-variant-label">
                      <span className="sr-only">Pack size for {related.name}</span>
                      <select value={variantIndex} onChange={event => setRelatedVariantIndexes(current => ({ ...current, [related.id]: Number(event.target.value) }))}>
                        {relatedVariants.map((option, index) => <option key={`${related.id}-${option.label}`} value={index}>{option.label}</option>)}
                      </select>
                    </label>
                    <button type="button" className="add-cart-related-submit" onClick={() => onOpenProduct(related)}><DetailIcon kind="cart" />Add to Cart</button>
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </section>
      </div>
    </dialog>
  );
}
