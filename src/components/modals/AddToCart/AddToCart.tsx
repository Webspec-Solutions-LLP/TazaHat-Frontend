"use client";

import { useBackClose } from "@/lib/backLayers";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import type { CartItem } from "../cart/Cart";
import Chat from "../chat/Chat";
import "swiper/css";
import catalog from "../../products/english.json";
import "./AddToCart.css";
import { cardToProduct, fallbackImage, isRemoteImage, mediaSrc, shortName, type ApiProductDetail, type Product as ShopProduct } from "@/lib/api";
import { getProductDetailAction } from "@/app/actions";
import { useImageZoom } from "@/lib/useImageZoom";
import PackAction, { AvailabilityNote, StockRibbon, firstOrderable, packStatus } from "@/components/availability/PackAction";

type Product = ShopProduct;

const plainText = (html: string | null | undefined) => (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"").replace(/\s+/g, " ").trim();

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
  const previousOverflow = useRef("");
  const descriptionRef = useRef<HTMLElement>(null);
  const [closing, setClosing] = useState(false);
  useBackClose(() => setClosing(true));
  const [quantity, setQuantity] = useState(1);
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedVariantIndexes, setRelatedVariantIndexes] = useState<Record<string, number>>({});
  const [relatedSaved, setRelatedSaved] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // The whole product (packs, dressing types, pictures, description, related products) comes from the backend, the same data the product
  // page uses. The card's own data is shown until it arrives, and kept when the product is not in the shop (demo products).
  const [detail, setDetail] = useState<ApiProductDetail | null>(null);
  const [detailState, setDetailState] = useState<"loading" | "ready" | "failed">("loading");
  const [dressingId, setDressingId] = useState("");
  const [specialInstruction, setSpecialInstruction] = useState("");
  useEffect(() => {
    let cancelled = false;
    void getProductDetailAction(product.id).then(found => {
      if (cancelled) return;
      setDetail(found);
      setDetailState(found ? "ready" : "failed");
    });
    return () => { cancelled = true; };
  }, [product.id]);
  const cardVariants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice, inStock: true, availableFromLabel: null }];
  const variants = detail && detail.packs.length
    ? detail.packs.map(p => ({ id: p.id, label: p.label, amount: 1, unit: "pack", price: Math.round(p.pricePaisa / 100), originalPrice: Math.round(p.mrpPaisa / 100), inStock: p.inStock, availableFrom: p.availableFrom, availableFromLabel: p.availableFromLabel, ratePaisa: p.weight ? p.ratePaisa : null as number | null }))
    : cardVariants.map(v => ({ ...v, ratePaisa: null as number | null }));
  const [variantIndex, setVariantIndex] = useState(() => firstOrderable(cardVariants, Math.max(0, cardVariants.findIndex(variant => variant.price === product.price))));
  const variant = variants[variantIndex] ?? variants[0];
  const dressing = detail?.cutting.find(c => c.id === dressingId);
  // the instruction box only appears when a custom cut is chosen
  const isCustomDressing = !!dressing && /custom/i.test(dressing.name);
  const dressingCharge = Math.round((dressing?.chargePaisa ?? 0) / 100);
  const imageSources = detail && detail.images.length ? detail.images.map(mediaSrc) : [product.image];
  const galleryImages = imageSources.map((src, index) => ({ src, label: `Image ${index + 1}` }));
  const hasThumbs = galleryImages.length > 1;
  const currentImage = galleryImages[Math.min(activeImage, galleryImages.length - 1)] ?? galleryImages[0];
  // hover zoom (lens + preview beside the picture) and tap zoom: the same as the product page
  const { galleryRef, lens, shownSrc, containerProps, imageProps, reset } = useImageZoom<HTMLDivElement>(hasThumbs);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const discount = variant.originalPrice > 0 ? Math.round((1 - variant.price / variant.originalPrice) * 100) : 0;
  const selectedPrice = (variant.price + dressingCharge) * quantity;
  const selectedOriginalPrice = (variant.originalPrice + dressingCharge) * quantity;
  const relatedProducts: Product[] = detail ? detail.related.map(cardToProduct) : detailState === "failed" ? catalog.products.filter(item => item.id !== product.id && item.category === product.category) : [];
  const relatedMoney = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const cartItemId = `${product.id}-${variant.label}${dressing ? `-${dressing.id}` : ""}`;
  const isAddedToCart = addedVariantId === cartItemId;
  // opened from a product card there is no cart callback: the navbar, which owns the cart, listens for these events (same as the product page)
  const addLine = (item: CartItem) => { if (onAddToCart) onAddToCart(item); else window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item })); };
  const changeLine = (delta: number) => { if (onUpdateCartQuantity) onUpdateCartQuantity(cartItemId, delta); else window.dispatchEvent(new CustomEvent("tazahat:update-cart-quantity", { detail: { id: cartItemId, delta } })); };
  const handleAddToCart = () => {
    addLine({
      id: cartItemId,
      name: product.name,
      image: imageSources[0],
      price: variant.price + dressingCharge,
      originalPrice: variant.originalPrice + dressingCharge,
      weight: `${variant.label}${dressing ? ` · ${shortName(dressing.name)}` : ""}${isCustomDressing && specialInstruction.trim() ? ` · “${specialInstruction.trim().slice(0, 60)}”` : ""}`,
      quantity: 1,
    });
    setQuantity(1);
    setAddedVariantId(cartItemId);
  };

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    previousOverflow.current = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow.current;
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
    <>
    <dialog ref={dialog} className={`add-cart-dialog${closing ? " is-closing" : ""}`} aria-labelledby="add-cart-title" onCancel={event => { event.preventDefault(); setClosing(true); }} onClick={event => { if (event.target === event.currentTarget) setClosing(true); }}>
      <button autoFocus type="button" className="add-cart-close" aria-label="Close product details" onClick={() => setClosing(true)}><DetailIcon kind="arrow" /></button>
      <div className="add-cart-panel">
        <div className="add-cart-layout">
          <div className="add-cart-gallery" ref={galleryRef}>
            <div className={`add-cart-photo${lens ? " is-zooming" : ""}${imageProps.style ? " is-tap-zoom" : ""}${hasThumbs ? " has-thumbs" : ""}`} id="add-cart-main-image" {...containerProps}>
              <span className="add-cart-photo-badge"><DetailIcon kind="leaf" />Fresh picks</span>
              <StockRibbon pack={variant} />
              <Image src={currentImage.src} alt={`${product.name} — ${currentImage.label}`} fill sizes="(max-width: 575px) 100vw, 440px" unoptimized={isRemoteImage(currentImage.src)} onError={fallbackImage} {...imageProps} />
              {lens && <span className="add-cart-zoom-lens" aria-hidden="true" style={lens.lens} />}
              {hasThumbs && <div className="add-cart-thumbnails" role="group" aria-label="Product images">
                {galleryImages.map((item, index) => <button key={`${item.src}-${index}`} type="button" className="add-cart-thumbnail" aria-label={`Show picture ${index + 1} of ${product.name}`} aria-pressed={activeImage === index} aria-controls="add-cart-main-image" onClick={() => { setActiveImage(index); reset(); }}>
                  <Image src={item.src} alt="" fill sizes="64px" unoptimized={isRemoteImage(item.src)} onError={fallbackImage} />
                </button>)}
              </div>}
            </div>
            {lens && <div className="add-cart-zoom-pane" aria-hidden="true" style={lens.pane}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shownSrc ?? currentImage.src} alt="" style={{ position: "absolute", maxWidth: "none", ...lens.img }} />
            </div>}
            <section className="add-cart-gallery-promise" aria-label="TazaHat quality promise">
              <span className="add-cart-gallery-promise-icon"><DetailIcon kind="shield" /></span>
              <span><strong>Freshness, checked daily</strong><small>Selected with care and packed to order.</small></span>
              <span className="add-cart-gallery-promise-check" aria-hidden="true">✓</span>
            </section>
          </div>
          <div className="add-cart-details">
            <span className="add-cart-category">{product.category}</span>
            <h2 id="add-cart-title">{product.name}</h2>
            {product.rating > 0 && <p className="add-cart-rating"><span aria-hidden="true">★</span> {product.rating} <span>({product.reviews} Reviews)</span></p>}
            {discount > 0 && <span className="add-cart-discount">{discount}% OFF</span>}
            <div className="add-cart-price" aria-live="polite" aria-atomic="true"><del>{money.format(selectedOriginalPrice)}</del><strong>{money.format(selectedPrice)}</strong><span>/ {variant.label} × {quantity}</span>{variant.ratePaisa ? <small>{money.format(variant.ratePaisa / 100)} / kg</small> : null}</div>
            <div className="add-cart-benefits">
              {[{ icon: "leaf", label: "Fresh picks" }, { icon: "flask", label: "Quality first" }, { icon: "snow", label: "Handled with care" }, { icon: "shield", label: "Carefully packed" }].map(item => <div key={item.icon}><DetailIcon kind={item.icon} /><span>{item.label}</span></div>)}
            </div>
            <fieldset className="add-cart-variants">
              <legend>Weight / Pack size</legend>
              <div className="add-cart-variant-grid">
                {variants.map((option, index) => <label key={option.label} className="add-cart-variant">
                  <input type="radio" name={`weight-${product.id}`} value={option.label} checked={variantIndex === index} onChange={() => { setVariantIndex(index); setQuantity(1); }} />
                  <span className="add-cart-variant-card"><span className="add-cart-variant-heading"><strong>{option.label}</strong><span className="add-cart-variant-check" aria-hidden="true">✓</span></span>{packStatus(option) === "soon" ? <small>From {option.availableFromLabel}</small> : packStatus(option) === "out" && <small>Out of stock</small>}</span>
                </label>)}
              </div>
            </fieldset>
            {detailState === "loading" && <div className="sk add-cart-field-skeleton" role="status" aria-label="Loading dressing options" />}
            {detail && detail.cutting.length > 0 && <label className="add-cart-field">Dressing Type<select value={dressingId} onChange={event => { setDressingId(event.target.value); setSpecialInstruction(""); setQuantity(1); }}><option value="">Select Dressing Type</option>{detail.cutting.map(c => <option key={c.id} value={c.id}>{c.name}{c.chargePaisa > 0 ? ` (+${money.format(c.chargePaisa / 100)})` : ""}</option>)}</select></label>}
            {isCustomDressing && <label className="add-cart-field">Special instruction<textarea rows={3} value={specialInstruction} onChange={event => setSpecialInstruction(event.target.value)} placeholder="Tell us how you want it cut (e.g. 6 pieces, head removed, small pieces for curry...)" maxLength={250} autoFocus /><small className="add-cart-field-count">{specialInstruction.length}/250</small></label>}
            <AvailabilityNote pack={variant} />
            <div className="add-cart-actions">
              {isAddedToCart ? (
                <div className="add-cart-quantity">
                  <div>
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => {
                        changeLine(-1);
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
                        changeLine(1);
                        setQuantity(value => value + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <PackAction pack={variant} className="add-cart-submit" onAdd={handleAddToCart}>
                  <DetailIcon kind="cart" />Add to Cart
                </PackAction>
              )}
              <button type="button" className="add-cart-wishlist add-cart-wishlist--icon" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} title={saved ? "Remove from wishlist" : "Add to wishlist"} onClick={onToggleWishlist}><DetailIcon kind="heart" /></button>
              <button type="button" className="add-cart-info" onClick={() => { dialog.current?.close(); document.body.style.overflow = previousOverflow.current; setIsChatOpen(true); }}><DetailIcon kind="info" />Info</button>
            </div>
          </div>
        </div>
    <section ref={descriptionRef} id="add-cart-description" className="add-cart-description add-cart-description--full" aria-labelledby="add-cart-description-title">
      <h3 id="add-cart-description-title">Description</h3>
      {detail ? <>
        <p>{plainText(detail.shortDescription) || (plainText(detail.description).length > 260 ? `${plainText(detail.description).slice(0, 260).trimEnd()}…` : plainText(detail.description)) || `${product.name} is selected for freshness and quality, then carefully packed to arrive ready for your kitchen.`}</p>
        {detail.description && <div className="add-cart-description-html" dangerouslySetInnerHTML={{ __html: detail.description }} />}
      </> : <p>{product.name} is a quality pick from our {product.category.toLowerCase()} range, selected for your everyday meals.</p>}
    </section>
        {relatedProducts.length > 0 && <section className="add-cart-related" aria-labelledby="add-cart-related-title">
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
                      <Image src={related.image} alt={related.name} fill sizes="(max-width: 600px) 42vw, 220px" unoptimized={isRemoteImage(related.image)} onError={fallbackImage} />
                      {relatedDiscount > 0 && <span className="add-cart-related-discount">{relatedDiscount}% OFF</span>}
                      <button type="button" className="add-cart-related-save" aria-label={`${isRelatedSaved ? "Remove" : "Save"} ${related.name} ${isRelatedSaved ? "from" : "to"} wishlist`} aria-pressed={isRelatedSaved} onClick={() => setRelatedSaved(current => isRelatedSaved ? current.filter(id => id !== related.id) : [...current, related.id])}>
                        <DetailIcon kind="heart" />
                      </button>
                      {related.rating > 0 && <span className="add-cart-related-rating">★ {related.rating}</span>}
                    </div>
                    <h3><Link href={`/${encodeURIComponent(related.id)}`}>{related.name}</Link></h3>
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
        </section>}
      </div>
    </dialog>
    {isChatOpen && <Chat onClose={() => { setIsChatOpen(false); setClosing(true); }} product={product} />}
    </>
  );
}
