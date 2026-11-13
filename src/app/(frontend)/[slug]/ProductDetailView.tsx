"use client";

import PackAction, { AvailabilityNote, StockRibbon } from "@/components/availability/PackAction";
import { placeholderImage } from "@/lib/brandText";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Products from "@/components/products/Products";
import CompareList, { COMPARE_CHANGE_EVENT, COMPARE_STORAGE_KEY, type CompareProduct } from "@/components/modals/compareList/CompareList";
import CompareDetails from "@/components/modals/compareDetails/CompareDetails";
import Confermation from "@/components/modals/confermation/Confermation";
import type { CartItem } from "@/components/modals/cart/Cart";
import { dressingChargeRupees } from "@/lib/cartLine";
import { cardToProduct, fallbackImage, isRemoteImage, mediaSrc, shortName, type ApiProductDetail } from "@/lib/api";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "@/lib/wishlist";
import ShareButton from "@/components/share/ShareButton";
import { useImageZoom } from "@/lib/useImageZoom";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./ProductDetails.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

function Icon({ name }: { name: "fish" | "leaf" | "shield" | "flask" | "box" | "cart" | "heart" | "minus" | "plus" | "info" | "compare" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    fish: <><path d="M3 12C8 2 17 5 20 12c-3 7-12 10-17 0Zm0 0-2-4v8l2-4Z"/><circle cx="16" cy="11" r=".8"/></>,
    leaf: <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8"/><path d="m9 15 5-5"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    flask: <><path d="M9 3h6m-5 0v6l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3"/><path d="M8 15h8"/></>,
    box: <><path d="m12 2 10 5v10l-10 5-10-5V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5"/></>,
    cart: <><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    minus: <path d="M5 12h14"/>, plus: <path d="M12 5v14M5 12h14" />,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    compare: <><path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const plainText = (html: string | null | undefined) => (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

/** One product for the visitor's city: packs, prices and cutting options come from the API. */
export default function ProductDetailView({ detail }: { detail: ApiProductDetail }) {
  const router = useRouter();
  // this page is its own screen: the bottom navigation steps aside while it is open (see ProductDetails.css)
  useEffect(() => { document.body.classList.add("pd-page"); return () => document.body.classList.remove("pd-page"); }, []);
  const goBack = () => { if (window.history.length > 1) router.back(); else router.push("/"); };
  const [currentLang] = useLanguage();

  const t = textMap[currentLang] || englishText;
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: t.currency, maximumFractionDigits: 0 });

  const isFish = /fish|seafood/i.test(detail.category.slug + detail.category.name);
  const trustItems = isFish ? t.fishTrust : t.generalTrust;
  const name = shortName(detail.name);
  const gallery = detail.images.length ? detail.images.map(mediaSrc) : [placeholderImage()];
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  // a link from the chat ("?variant=..&dressing=..") opens the product with that size and dressing already chosen
  const query = useSearchParams();
  const wantedPack = detail.packs.findIndex(p => p.id === query.get("variant"));
  const wantedDressing = detail.cutting.find(c => c.id === query.get("dressing"));
  const firstAvailable = wantedPack >= 0 ? wantedPack : Math.max(0, detail.packs.findIndex(p => p.inStock));
  const [packIndex, setPackIndex] = useState(firstAvailable);
  const savedDressing = wantedDressing ?? detail.cutting.find(c => c.sameAsLast);
  const [dressingId, setDressingId] = useState(savedDressing?.id ?? "");
  const [dressingError, setDressingError] = useState(false);
  const dressingSelect = useRef<HTMLSelectElement>(null);
  const [specialInstruction, setSpecialInstruction] = useState(savedDressing?.details ?? "");
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
  const dressingCharge = dressing ? dressingChargeRupees(dressing.chargePaisa, pack?.grams) : 0;
  const unitPrice = pack ? Math.round(pack.pricePaisa / 100) + dressingCharge : 0;
  const unitMrp = pack ? Math.round(pack.mrpPaisa / 100) + dressingCharge : 0;
  const mainImage = gallery[Math.min(activeImage, gallery.length - 1)];
  // short description; when the product has none, the start of the full description
  const longText = plainText(detail.description);
  const shortText = plainText(detail.shortDescription) || (longText.length > 260 ? `${longText.slice(0, 260).trimEnd()}…` : longText) || t.defaultFallbackDescription.replace("{name}", name);

  // Zoom. Mouse on a wide screen: a lens follows the pointer over the picture and a larger preview opens beside it (Amazon / Flipkart
  // style). Touch or narrow screens: tap the picture to zoom in at that spot, tap again to zoom out.
  const hasThumbs = gallery.length > 1;
  const { galleryRef, lens, shownSrc, containerProps, imageProps, reset } = useImageZoom<HTMLElement>(hasThumbs);
  const leftRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLElement>(null);
  // The description card ends where the left column (picture + quality promise) ends and scrolls inside; on small screens it is capped.
  const [descMax, setDescMax] = useState<number | null>(null);
  useEffect(() => {
    const left = leftRef.current, overview = overviewRef.current, extra = extraRef.current;
    if (!left || !overview || !extra) return;
    const measure = () => {
      if (window.innerWidth < 576) return setDescMax(null);
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
  const lineId = pack ? `${detail.slug}-${pack.label}${dressing ? `-${dressing.id}` : ""}` : "";
  const inCart = cartLines.find(line => line.id === lineId);
  const compareProduct: CompareProduct = { id: detail.slug, name, image: mainImage, price: unitPrice, originalPrice: unitMrp, unit: pack?.label ?? detail.unit ?? "pack", rating: 0, reviews: 0 };
  const addToCart = () => {
    if (!pack || !pack.inStock) return;
    // real dressing types: one of them has to be chosen
    if (detail.dressingRequired && !dressing) { setDressingError(true); dressingSelect.current?.focus(); return; }
    const item: CartItem = {
      id: lineId,
      name,
      image: gallery[0],
      price: unitPrice,
      originalPrice: unitMrp,
      slug: detail.slug, variantId: pack.id, packLabel: pack.label, cuttingTypeId: dressing?.id ?? null, dressingName: dressing ? shortName(dressing.name) : undefined, dressingCharge: dressing ? dressingCharge : undefined,
      instruction: isCustomDressing ? specialInstruction.trim().slice(0, 200) || undefined : undefined,
      weight: `${pack.label}${dressing ? ` · ${shortName(dressing.name)}` : ""}${isCustomDressing && specialInstruction.trim() ? ` · “${specialInstruction.trim().slice(0, 60)}”` : ""}`,
      quantity: 1,
    };
    window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
  };
  // "ask about this product": the chat opens with it tagged (the size and the dressing chosen), the customer adds a few words and sends
  const askAboutProduct = () => {
    const raw = gallery[0] ?? "";
    const upload = /\/uploads\/[\w./-]+/.exec(raw)?.[0];
    const sub = [pack?.label, dressing ? shortName(dressing.name) : "", isCustomDressing && specialInstruction.trim() ? `“${specialInstruction.trim().slice(0, 60)}”` : ""].filter(Boolean).join(" · ");
    window.dispatchEvent(new CustomEvent("tazahat:open-chat", { detail: { tag: { title: shortName(detail.name), subtitle: sub || undefined, price: pack ? money.format(unitPrice) : undefined, variantId: pack?.id, cuttingId: dressing?.id, image: upload ?? (/^https:\/\//.test(raw) ? raw : undefined), url: `${window.location.origin}/${encodeURIComponent(detail.slug)}${pack ? `?variant=${encodeURIComponent(pack.id)}${dressing ? `&dressing=${encodeURIComponent(dressing.id)}` : ""}` : ""}` } } }));
  };
  const changeQuantity = (delta: number) => window.dispatchEvent(new CustomEvent("tazahat:update-cart-quantity", { detail: { id: lineId, delta } }));

  return <main className="product-details-page" lang={t.language}>
    <div className="product-details-shell">
      <div className="pd-layout">
        <div className="pd-left-column" ref={leftRef}><section className="pd-gallery" aria-label={t.productImagesAria} ref={galleryRef}>

          <div className={`pd-main-image${lens ? " is-zooming" : ""}${imageProps.style ? " is-tap-zoom" : ""}${hasThumbs ? " has-thumbs" : ""}`}
            {...containerProps}
            onTouchStart={event => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={event => {
              const startX = touchStartX.current;
              touchStartX.current = null;
              const endX = event.changedTouches[0]?.clientX;
              if (!hasThumbs || startX === null || endX === undefined || Math.abs(endX - startX) < 40) return;
              setActiveImage(index => Math.max(0, Math.min(gallery.length - 1, index + (endX < startX ? 1 : -1))));
              reset();
            }}>
            <Image src={mainImage} alt={name} fill priority sizes="(max-width: 900px) 100vw, 40vw" unoptimized={isRemoteImage(mainImage)} onError={fallbackImage} {...imageProps} />
            {lens && <span className="pd-zoom-lens" aria-hidden="true" style={lens.lens} />}
            <button type="button" className="pd-back" aria-label="Back" onClick={goBack}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
            <div className="pd-mobile-image-actions">
              <button type="button" className="pd-image-action" aria-pressed={saved} aria-label={saved ? t.removeFromWishlist : t.addToWishlist} title={saved ? t.removeFromWishlist : t.addToWishlist} onClick={event => { event.stopPropagation(); setSaved(toggleWishlistId(detail.slug).includes(detail.slug)); }}><Icon name="heart" /></button>
              <span className="pd-image-share" onClick={event => event.stopPropagation()}><ShareButton title={shortName(detail.name)} text={plainText(detail.shortDescription || detail.description).slice(0, 140) || undefined} path={`/${encodeURIComponent(detail.slug)}`} label="Share this product" /></span>
              <button type="button" className="pd-image-action" aria-label={t.openCartAria} title={t.openCartAria} onClick={event => { event.stopPropagation(); window.dispatchEvent(new Event("tazahat:open-cart")); }}><Icon name="cart" /></button>
            </div>
            <StockRibbon pack={pack} />
            {isFish ? <span className="pd-fresh">🐟 &nbsp;{t.freshCatch}</span> : <span className="pd-fresh">🌿 &nbsp;{t.freshQualityChecked}</span>}<span className="pd-natural">◉ &nbsp;{t.freshNatural}</span>
            {hasThumbs && <div className="pd-mobile-image-pagination" role="group" aria-label={t.productPicturesAria}>
              {gallery.map((src, index) => <button key={`${src}-${index}`} type="button" className={index === activeImage ? "is-active" : ""} aria-label={t.showImageAria.replace("{index}", String(index + 1))} aria-current={index === activeImage ? "true" : undefined} onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setActiveImage(index); reset(); }} />)}
            </div>}
          </div>
          {hasThumbs && <div className="pd-thumbnails" role="tablist" aria-label={t.productPicturesAria}>{gallery.map((src, index) => <button key={`${src}-${index}`} className={mainImage === src ? "is-active" : ""} onClick={() => { setActiveImage(index); reset(); }} aria-label={t.showImageAria.replace("{index}", String(index + 1))} role="tab" aria-selected={mainImage === src}><Image src={src} alt={`${name} - picture ${index + 1}`} fill sizes="76px" unoptimized={isRemoteImage(src)} onError={fallbackImage} /></button>)}</div>}
          {lens && <div className="pd-zoom-pane" aria-hidden="true" style={lens.pane}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownSrc ?? mainImage} alt="" style={{ position: "absolute", maxWidth: "none", ...lens.img }} />
          </div>}
        </section>
        <aside className="pd-trust" aria-label={t.qualityPromisesAria}>
          <h2 className="pd-trust-heading"><span className="pd-trust-heading-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="8" /><path d="m12 5.5 1.4 2.8 3.1.5-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.2 3.1-.5L12 5.5Z" /><path d="m8 17-1 5 5-2 5 2-1-5" /></svg></span>{t.qualityPromise}</h2>
          <ul>{trustItems.map(item => <li key={item.title}><span className="pd-trust-icon"><Icon name={item.icon as "fish" | "leaf" | "shield" | "flask" | "box"} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span></li>)}</ul>
        </aside>
        </div>
        <div className="pd-right-column">
          <div className="pd-right-overview" ref={overviewRef}>
        <section className="pd-info" aria-labelledby="pd-title">
          <h1 id="pd-title">{name}</h1>
          {pack ? <>
            <div className="pd-price-row">
              <strong>{money.format(unitPrice)}</strong>
              {unitMrp > unitPrice && <del>{money.format(unitMrp)}</del>}
              <span className="pd-unit-price">{pack.weight ? `${money.format(pack.ratePaisa / 100)} / kg · ` : ""}{money.format(unitPrice)} {t.per} {pack.label}</span>
              {pack.discountPercent > 0 && <span className="pd-price-discount">{pack.discountPercent}% {t.off}</span>}
            </div>
            <fieldset className="pd-variant-picker">
              <legend><strong>{t.weightPackSize}</strong><span>{pack.label}</span></legend>
              <div className="pd-weights">{detail.packs.map((option, index) => <label key={option.id} className={`pd-weight-option${packIndex === index ? " is-selected" : ""}${option.inStock ? "" : " is-sold-out"}`}>
                <input type="radio" name={`weight-${detail.id}`} value={option.label} checked={packIndex === index} onChange={() => setPackIndex(index)} />
                <span className="pd-weight-option-card"><strong>{option.label}</strong>{option.availableFromLabel ? <small>From {option.availableFromLabel}</small> : !option.inStock && <small>{t.outOfStock}</small>}</span>
              </label>)}</div>
            </fieldset>
          </> : <p className="pd-description">{t.notOnSale}</p>}
          {detail.cutting.length > 0 && <label className={`pd-field${dressingError ? " has-error" : ""}`}><span>{t.dressingType}{detail.dressingRequired ? <b className="pd-required" aria-hidden="true"> *</b> : null}</span><select ref={dressingSelect} required={detail.dressingRequired} aria-invalid={dressingError || undefined} value={dressingId} onChange={event => { setDressingId(event.target.value); setSpecialInstruction(""); setDressingError(false); }}><option value="">Select Dressing Type</option>{detail.cutting.map(c => <option key={c.id} value={c.id}>{c.name}{c.chargePaisa > 0 ? ` (+${money.format(c.chargePaisa / 100)})` : ""}</option>)}</select>{dressingError && <small className="pd-field-error" role="alert">Please choose a dressing type before adding to the cart.</small>}</label>}
          {isCustomDressing && <label className="pd-field"><span>{t.specialInstruction}</span><textarea rows={4} value={specialInstruction} onChange={event => setSpecialInstruction(event.target.value)} placeholder={t.specialInstructionPlaceholder} maxLength={250} autoFocus /><small className="pd-field-count">{specialInstruction.length}/250</small></label>}
          <AvailabilityNote pack={pack} />
          <div className="pd-actions">
            {inCart ? (
              <div className="pd-quantity" role="group" aria-label={t.quantityAria.replace("{name}", name)}>
                <button type="button" aria-label={inCart.quantity <= 1 ? t.removeFromCartAria : t.decreaseQuantityAria} onClick={() => changeQuantity(-1)}><Icon name="minus" /></button>
                <output aria-live="polite" aria-label={t.quantityInCartAria}>{inCart.quantity}</output>
                <button type="button" aria-label={t.increaseQuantityAria} disabled={inCart.quantity >= 99} onClick={() => changeQuantity(1)}><Icon name="plus" /></button>
              </div>
            ) : (
              pack ? <PackAction pack={pack} className="pd-add-cart" onAdd={addToCart}><Icon name="cart" /> {t.addToCart}</PackAction> : <button type="button" className="pd-add-cart" disabled><Icon name="cart" /> {t.addToCart}</button>
            )}
            <button type="button" className="pd-wishlist pd-wishlist--icon" aria-pressed={saved} aria-label={saved ? t.removeFromWishlist : t.addToWishlist} title={saved ? t.removeFromWishlist : t.addToWishlist} onClick={() => setSaved(toggleWishlistId(detail.slug).includes(detail.slug))}><Icon name="heart" /></button>
            <ShareButton title={shortName(detail.name)} text={plainText(detail.shortDescription || detail.description).slice(0, 140) || undefined} path={`/${encodeURIComponent(detail.slug)}`} label="Share this product" />
            <button type="button" className="pd-chat-btn" aria-label="Ask about this product" title="Ask about this product" onClick={askAboutProduct}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12Z" /></svg></button>
            <button type="button" className={`pd-compare${isCompared ? " is-compared" : ""}`} disabled={isCompared} onClick={handleAddToCompare} title={isCompared ? t.alreadyAddedToCompare : t.addToCompare}><Icon name="compare" /><span>{isCompared ? t.addedToCompare : t.addToCompare}</span></button>
          </div>
          <div className="pd-order-note"><span><Icon name="shield" /></span><p><strong>{t.trustHeading}</strong><small>{t.trustText}</small></p></div>
        </section>
      </div>
          <section className="pd-extra" ref={extraRef} aria-label={t.moreInfoAria} style={descMax ? { maxHeight: descMax } : undefined} tabIndex={0}>
            <ol className="pd-info-list">
              <li><h2>{t.shortDescription}</h2><p>{shortText}</p></li>
              <li><h2>{t.shippingDelivery}</h2><p>{t.shippingDeliveryText}</p></li>
            </ol>
          </section>
        </div>
      </div>
      {detail.description && <section className="pd-full-description" aria-labelledby="pd-full-description-title">
        <h2 id="pd-full-description-title">{t.productDescription}</h2>
        <div className="pd-description-html" dangerouslySetInnerHTML={{ __html: detail.description }} />
      </section>}
      {detail.related.length > 0 && <div className="pd-related"><Products heading={t.relatedProducts} products={detail.related.map(cardToProduct)} showViewAll={false} layout="related" /></div>}
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
