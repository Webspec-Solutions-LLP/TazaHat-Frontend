"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Products from "@/components/products/Products";
import CompareList, { COMPARE_CHANGE_EVENT, COMPARE_STORAGE_KEY, type CompareProduct } from "@/components/modals/compareList/CompareList";
import CompareDetails from "@/components/modals/compareDetails/CompareDetails";
import Confermation from "@/components/modals/confermation/Confermation";
import type { CartItem } from "@/components/modals/cart/Cart";
import { cardToProduct, fallbackImage, isRemoteImage, mediaSrc, PLACEHOLDER_IMAGE, shortName, type ApiProductDetail } from "@/lib/api";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "@/lib/wishlist";
import "./ProductDetails.css";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
function Icon({ name }: { name: "fish" | "leaf" | "shield" | "flask" | "box" | "cart" | "heart" | "minus" | "plus" | "info" | "compare" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    fish: <><path d="M3 12C8 2 17 5 20 12c-3 7-12 10-17 0Zm0 0-2-4v8l2-4Z"/><circle cx="16" cy="11" r=".8"/></>,
    leaf: <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8"/><path d="m9 15 5-5"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    flask: <><path d="M9 3h6m-5 0v6l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3"/><path d="M8 15h8"/></>,
    box: <><path d="m12 2 10 5v10l-10 5-10-5V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5"/></>,
    cart: <><path d="M2 3h3l3 13h11l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    minus: <path d="M5 12h14"/>, plus: <path d="M12 5v14M5 12h14" />,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    compare: <><path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}


const FISH_TRUST = [
  { icon: "fish" as const, title: "100% Fresh Catch", text: "Daily fresh supply" },
  { icon: "leaf" as const, title: "Naturally Sourced", text: "From clean rivers" },
  { icon: "shield" as const, title: "Hygienically Cleaned", text: "Safe for your family" },
  { icon: "flask" as const, title: "No Preservatives", text: "Pure & natural" },
  { icon: "box" as const, title: "Packed with Care", text: "Leak proof packaging" },
];
const GENERAL_TRUST = [
  { icon: "leaf" as const, title: "Fresh & Natural", text: "Quality checked daily" },
  { icon: "shield" as const, title: "Hygienically Handled", text: "Safe for your family" },
  { icon: "flask" as const, title: "No Preservatives", text: "Pure & natural" },
  { icon: "box" as const, title: "Packed with Care", text: "Leak proof packaging" },
];

const plainText = (html: string | null | undefined) => (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

/** One product for the visitor's city: packs, prices and cutting options come from the API. */
export default function ProductDetailView({ detail }: { detail: ApiProductDetail }) {
  const isFish = /fish|seafood/i.test(detail.category.slug + detail.category.name);
  const trustItems = isFish ? FISH_TRUST : GENERAL_TRUST;
  const name = shortName(detail.name);
  const gallery = detail.images.length ? detail.images.map(mediaSrc) : [PLACEHOLDER_IMAGE];
  const [activeImage, setActiveImage] = useState(0);
  const firstAvailable = Math.max(0, detail.packs.findIndex(p => p.inStock));
  const [packIndex, setPackIndex] = useState(firstAvailable);
  const [dressingId, setDressingId] = useState("");
  const [specialInstruction, setSpecialInstruction] = useState("");
  // what is in the cart now (the navbar keeps the cart and announces it): the quantity stepper shows once this pack has been added
  const [cartLines, setCartLines] = useState<CartItem[]>([]);
  useEffect(() => {
    const onCart = (event: Event) => setCartLines(Array.isArray((event as CustomEvent).detail) ? ((event as CustomEvent<CartItem[]>).detail) : []);
    window.addEventListener("tazahat:cart-changed", onCart);
    window.dispatchEvent(new Event("tazahat:cart-request"));
    return () => window.removeEventListener("tazahat:cart-changed", onCart);
  }, []);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const refresh = () => setSaved(readWishlistIds().includes(detail.slug));
    refresh();
    return subscribeToWishlist(refresh);
  }, [detail.slug]);

  const pack = detail.packs[packIndex];

  // Compare (from main): add this product to a compare list of up to a few products and open the side-by-side view
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCompareDetailsOpen, setIsCompareDetailsOpen] = useState(false);
  const [compareDetailsProducts, setCompareDetailsProducts] = useState<CompareProduct[]>([]);
  const [compareInitialSelectedIds, setCompareInitialSelectedIds] = useState<string[]>([]);
  const [isCompared, setIsCompared] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        const list: unknown = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]");
        setIsCompared(Array.isArray(list) && list.some((item: { id: string }) => item.id === detail.slug));
      } catch {
        setIsCompared(false);
      }
    };
    check();
    window.addEventListener(COMPARE_CHANGE_EVENT, check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener(COMPARE_CHANGE_EVENT, check);
      window.removeEventListener("storage", check);
    };
  }, [detail.slug]);
  const handleAddToCompare = () => {
    if (isCompared) return;
    try {
      const list: unknown = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]");
      if (Array.isArray(list) && list.some((item: { id: string }) => item.id !== detail.slug)) {
        setIsConfirmOpen(true); // other products are already being compared: ask whether to include this one
        return;
      }
    } catch {
      // an unreadable list is treated as empty
    }
    setCompareInitialSelectedIds([]);
    setIsCompared(true);
    setIsCompareOpen(true);
  };
  const handleConfirm = (includeThis: boolean) => {
    setIsConfirmOpen(false);
    setIsCompared(true);
    setCompareInitialSelectedIds(includeThis ? [detail.slug] : []);
    setIsCompareOpen(true);
  };
  const dressing = detail.cutting.find(c => c.id === dressingId);
  // the instruction box only appears when a custom cut is chosen
  const isCustomDressing = !!dressing && /custom/i.test(dressing.name);
  const dressingCharge = Math.round((dressing?.chargePaisa ?? 0) / 100);
  const unitPrice = pack ? Math.round(pack.pricePaisa / 100) + dressingCharge : 0;
  const unitMrp = pack ? Math.round(pack.mrpPaisa / 100) + dressingCharge : 0;
  const mainImage = gallery[Math.min(activeImage, gallery.length - 1)];
  // short description; when the product has none, the start of the full description
  const longText = plainText(detail.description);
  const shortText = plainText(detail.shortDescription) || (longText.length > 260 ? `${longText.slice(0, 260).trimEnd()}…` : longText) || `${name} is selected for freshness and quality, then carefully packed to arrive ready for your kitchen.`;

  // Zoom. Mouse on a wide screen: a lens follows the pointer over the picture and a larger preview opens beside it (Amazon / Flipkart
  // style). Touch or narrow screens: tap the picture to zoom in at that spot, tap again to zoom out.
  const ZOOM = 2.6;
  const THUMB_STRIP = 88; // px kept free on the left of the picture for the thumbnails
  const hasThumbs = gallery.length > 1;
  const galleryRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLElement>(null);
  // The description card ends where the left column (picture + quality promise) ends and scrolls inside; on small screens it is capped.
  const [descMax, setDescMax] = useState<number | null>(null);
  useEffect(() => {
    const left = leftRef.current, overview = overviewRef.current, extra = extraRef.current;
    if (!left || !overview || !extra) return;
    const measure = () => {
      if (window.innerWidth < 877) return setDescMax(420);
      const gap = parseFloat(getComputedStyle(extra).marginTop) || 0;
      setDescMax(Math.max(240, Math.round(left.getBoundingClientRect().height - overview.getBoundingClientRect().height - gap)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(left);
    observer.observe(overview);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  // the picture that is really on screen (the logo when the product's own file is missing), so the preview shows the same one
  const [shownSrc, setShownSrc] = useState<string | null>(null);
  const [tapZoom, setTapZoom] = useState<{ x: number; y: number } | null>(null);
  const [lens, setLens] = useState<null | {
    lens: { left: number; top: number; width: number; height: number };
    pane: { left: number; top: number; width: number; height: number };
    img: { left: number; top: number; width: number; height: number };
  }>(null);
  const spot = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { r, cx: e.clientX - r.left, cy: e.clientY - r.top };
  };
  const moveLens = (e: React.PointerEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current;
    if (e.pointerType === "touch" || !gallery || !natural || window.innerWidth < 877) return;
    const { r, cx, cy } = spot(e);
    // where the picture really sits inside the box: shown "contain", 12px padding, and room for the thumbnail strip on the left
    const padL = hasThumbs ? THUMB_STRIP : 12;
    const availW = r.width - padL - 12, availH = r.height - 24;
    const scale = Math.min(availW / natural.w, availH / natural.h);
    const dw = natural.w * scale, dh = natural.h * scale;
    const ox = padL + (availW - dw) / 2, oy = 12 + (availH - dh) / 2;
    if (cx < ox || cx > ox + dw || cy < oy || cy > oy + dh) return setLens(null);
    const g = gallery.getBoundingClientRect();
    // The preview is a popup beside the picture: a little taller (above and below it) and wider than the picture, kept inside the window
    const paneH = Math.min(r.height + 96, window.innerHeight - 110);
    const paneW = Math.min(r.width * 1.3, window.innerWidth - r.right - 36);
    const paneTopInWindow = Math.max(88, Math.min(r.top - (paneH - r.height) / 2, window.innerHeight - paneH - 14));
    const pane = { left: r.right - g.left + 16, top: paneTopInWindow - g.top, width: paneW, height: paneH };
    if (pane.width < 260) return setLens(null);
    const lw = pane.width / ZOOM, lh = pane.height / ZOOM;
    const lx = Math.min(Math.max(cx - lw / 2, ox), ox + dw - lw), ly = Math.min(Math.max(cy - lh / 2, oy), oy + dh - lh);
    const iw = dw * ZOOM, ih = dh * ZOOM;
    setLens({
      lens: { left: lx, top: ly, width: lw, height: lh },
      pane,
      img: { width: iw, height: ih, left: -((lx - ox) / dw) * iw, top: -((ly - oy) / dh) * ih },
    });
  };

  const lineId = pack ? `${detail.slug}-${pack.label}${dressing ? `-${dressing.id}` : ""}` : "";
  const inCart = cartLines.find(line => line.id === lineId);
  const compareProduct: CompareProduct = { id: detail.slug, name, image: mainImage, price: unitPrice, originalPrice: unitMrp, unit: pack?.label ?? detail.unit ?? "pack", rating: 0, reviews: 0 };
  const addToCart = () => {
    if (!pack || !pack.inStock) return;
    const item: CartItem = {
      id: lineId,
      name,
      image: gallery[0],
      price: unitPrice,
      originalPrice: unitMrp,
      weight: `${pack.label}${dressing ? ` · ${shortName(dressing.name)}` : ""}${isCustomDressing && specialInstruction.trim() ? ` · “${specialInstruction.trim().slice(0, 60)}”` : ""}`,
      quantity: 1,
    };
    window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
  };
  const changeQuantity = (delta: number) => window.dispatchEvent(new CustomEvent("tazahat:update-cart-quantity", { detail: { id: lineId, delta } }));

  return <main className="product-details-page">
    <div className="product-details-shell">
      <div className="pd-layout">
        <div className="pd-left-column" ref={leftRef}><section className="pd-gallery" aria-label="Product images" ref={galleryRef}>

          <div className={`pd-main-image${lens ? " is-zooming" : ""}${tapZoom ? " is-tap-zoom" : ""}${hasThumbs ? " has-thumbs" : ""}`}
            onPointerMove={moveLens} onPointerLeave={e => { if (e.pointerType !== "touch") setLens(null); }}
            onPointerUp={e => { if (e.pointerType === "touch" || window.innerWidth < 877) { const { r, cx, cy } = spot(e); setTapZoom(current => current ? null : { x: (cx / r.width) * 100, y: (cy / r.height) * 100 }); } }}>
            <Image src={mainImage} alt={name} fill priority sizes="(max-width: 900px) 100vw, 40vw" unoptimized={isRemoteImage(mainImage)} onError={fallbackImage}
              onLoad={e => { setNatural({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 }); setShownSrc(e.currentTarget.currentSrc || null); }}
              style={tapZoom ? { transform: "scale(2.2)", transformOrigin: `${tapZoom.x}% ${tapZoom.y}%` } : undefined} />
            {lens && <span className="pd-zoom-lens" aria-hidden="true" style={lens.lens} />}
            {isFish ? <span className="pd-fresh">🐟 &nbsp;Fresh Catch</span> : <span className="pd-fresh">🌿 &nbsp;Fresh &amp; Quality Checked</span>}<span className="pd-natural">◉ &nbsp;100% Fresh &amp; Natural</span>
          </div>
          {hasThumbs && <div className="pd-thumbnails" role="tablist" aria-label="Product pictures">{gallery.map((src, index) => <button key={`${src}-${index}`} className={mainImage === src ? "is-active" : ""} onClick={() => { setActiveImage(index); setLens(null); setTapZoom(null); }} aria-label={`Show product image ${index + 1}`} role="tab" aria-selected={mainImage === src}><Image src={src} alt={`${name} - picture ${index + 1}`} fill sizes="76px" unoptimized={isRemoteImage(src)} onError={fallbackImage} /></button>)}</div>}
          {lens && <div className="pd-zoom-pane" aria-hidden="true" style={lens.pane}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownSrc ?? mainImage} alt="" style={{ position: "absolute", maxWidth: "none", ...lens.img }} />
          </div>}
        </section>
        <aside className="pd-trust" aria-label="Product quality promises">
          <h2 className="pd-trust-heading">Our Quality Promise</h2>
          <ul>{trustItems.map(item => <li key={item.title}><span className="pd-trust-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span></li>)}</ul>
          <div className="pd-river-art"><span aria-hidden="true">{isFish ? "🐟　🌿" : "🌿　🥬"}</span></div>
        </aside>
        </div>
        <div className="pd-right-column">
          <div className="pd-right-overview" ref={overviewRef}>
        <section className="pd-info" aria-labelledby="pd-title">
          <h1 id="pd-title">{name}</h1>
          {pack ? <>
            <div className="pd-price-row"><strong>{money.format(unitPrice)}</strong>{unitMrp > unitPrice && <del>{money.format(unitMrp)}</del>}<span>({pack.weight ? `${money.format(pack.ratePaisa / 100)} / kg · ` : ""}{money.format(unitPrice)} per {pack.label}){pack.discountPercent > 0 ? ` · ${pack.discountPercent}% off` : ""}</span></div>
            <fieldset className="pd-variant-picker">
              <legend><strong>Weight / Pack size</strong><span>{pack.label}</span></legend>
              <div className="pd-weights">{detail.packs.map((option, index) => <label key={option.id} className={`pd-weight-option${packIndex === index ? " is-selected" : ""}${option.inStock ? "" : " is-sold-out"}`}>
                <input type="radio" name={`weight-${detail.id}`} value={option.label} checked={packIndex === index} disabled={!option.inStock} onChange={() => setPackIndex(index)} />
                <span className="pd-weight-option-card"><strong>{option.label}</strong>{!option.inStock && <small>Out of stock</small>}</span>
              </label>)}</div>
            </fieldset>
          </> : <p className="pd-description">This product is not on sale in your city right now.</p>}
          {detail.cutting.length > 0 && <label className="pd-field"><span>Dressing Type</span><select value={dressingId} onChange={event => { setDressingId(event.target.value); setSpecialInstruction(""); }}><option value="">Select Dressing Type</option>{detail.cutting.map(c => <option key={c.id} value={c.id}>{c.name}{c.chargePaisa > 0 ? ` (+${money.format(c.chargePaisa / 100)})` : ""}</option>)}</select></label>}
          {isCustomDressing && <label className="pd-field"><span>Special instruction</span><textarea rows={4} value={specialInstruction} onChange={event => setSpecialInstruction(event.target.value)} placeholder="Tell us how you want it cut (e.g. 6 pieces, head removed, small pieces for curry...)" maxLength={250} autoFocus /><small className="pd-field-count">{specialInstruction.length}/250</small></label>}
          <div className="pd-actions">
            {inCart ? (
              <div className="pd-quantity" role="group" aria-label={`Quantity of ${name} in your cart`}>
                <button type="button" aria-label={inCart.quantity <= 1 ? "Remove from cart" : "Decrease quantity"} onClick={() => changeQuantity(-1)}><Icon name="minus" /></button>
                <output aria-live="polite" aria-label="Quantity in cart">{inCart.quantity}</output>
                <button type="button" aria-label="Increase quantity" disabled={inCart.quantity >= 99} onClick={() => changeQuantity(1)}><Icon name="plus" /></button>
              </div>
            ) : (
              <button type="button" className="pd-add-cart" onClick={addToCart} disabled={!pack || !pack.inStock}><Icon name="cart" /> {pack && !pack.inStock ? "Out of stock" : "Add to Cart"}</button>
            )}
            <button type="button" className="pd-wishlist pd-wishlist--icon" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"} title={saved ? "Remove from wishlist" : "Add to wishlist"} onClick={() => setSaved(toggleWishlistId(detail.slug).includes(detail.slug))}><Icon name="heart" /></button>
            <button type="button" className={`pd-compare${isCompared ? " is-compared" : ""}`} disabled={isCompared} onClick={handleAddToCompare} title={isCompared ? "Already added to compare" : "Add to compare"}><Icon name="compare" /><span>{isCompared ? "Added to Compare" : "Add to Compare"}</span></button>
          </div>
          <div className="pd-order-note"><span><Icon name="shield" /></span><p><strong>Freshness you can trust</strong><small>Carefully selected, hygienically handled and packed fresh for delivery.</small></p></div>
        </section>
      </div>
          <section className="pd-extra" ref={extraRef} aria-label="More product information" style={descMax ? { maxHeight: descMax } : undefined} tabIndex={0}>
            <ol className="pd-info-list">
              <li><h2>Short Description</h2><p>{shortText}</p></li>
              <li><h2>Shipping &amp; Delivery</h2><p>We carefully pack every order to keep it fresh. Delivery availability and timing depend on your location.</p></li>
            </ol>
          </section>
        </div>
      </div>
      {detail.description && <section className="pd-full-description" aria-labelledby="pd-full-description-title">
        <h2 id="pd-full-description-title">Product Description</h2>
        <div className="pd-description-html" dangerouslySetInnerHTML={{ __html: detail.description }} />
      </section>}
      {detail.related.length > 0 && <div className="pd-related"><Products heading="Related Products" products={detail.related.map(cardToProduct)} showViewAll={false} layout="related" /></div>}
    </div>
    {isCompareOpen && (
      <CompareList
        onClose={() => setIsCompareOpen(false)}
        initialSelectedIds={compareInitialSelectedIds}
        product={compareProduct}
        onContinueCompare={(selected: CompareProduct[]) => { setIsCompareOpen(false); setCompareDetailsProducts(selected); setIsCompareDetailsOpen(true); }}
        onRemoveItem={(removedId: string) => { if (removedId === detail.slug) setIsCompared(false); }}
        onClearAll={() => setIsCompared(false)}
      />
    )}
    {isCompareDetailsOpen && (
      <CompareDetails products={compareDetailsProducts} onClose={() => setIsCompareDetailsOpen(false)} onBackToList={() => { setIsCompareDetailsOpen(false); setIsCompareOpen(true); }} />
    )}
    {isConfirmOpen && <Confermation onClose={() => setIsConfirmOpen(false)} onYes={() => handleConfirm(true)} onNo={() => handleConfirm(false)} productName={name} productImage={mainImage} />}
  </main>;
}
