"use client";

import { navigateAfterClose, useBackClose } from "@/lib/backLayers";

import { useEffect, useRef, useState, useId } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./Cart.css";
import Link from "next/link";
import { fallbackImage, isRemoteImage, type CartLineCheck } from "@/lib/api";
import { checkCartAction, cartRelatedAction } from "@/app/actions";
import Variant from "@/components/modals/variant/Variant";
import type { Product } from "@/lib/api";

export type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  weight?: string;
  quantity: number;
  /** product page address, pack and dressing as chosen: the server re-checks the line with these */
  slug?: string;
  variantId?: string;
  packLabel?: string;
  cuttingTypeId?: string | null;
  dressingName?: string;
  /** dressing charge in rupees already inside `price` */
  dressingCharge?: number;
  instruction?: string;
};

export interface CartProps {
  onClose: () => void;
  items?: CartItem[];
  onItemsChange?: (items: CartItem[]) => void;
  currencySymbol?: string;
  onCheckout?: (items: CartItem[], total: number) => void;
}

export default function Cart({
  onClose,
  items: externalItems,
  onItemsChange,
  currencySymbol = "Rs",
  onCheckout,
}: CartProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>(externalItems ?? []);
  const isInitialCartItemsEffect = useRef(true);
  const titleId = useId();

  // items put in the cart from outside while it is open (the "You may also like" strip, another tab) show up here too
  useEffect(() => {
    if (!externalItems) return;
    setCartItems(current => (JSON.stringify(current) === JSON.stringify(externalItems) ? current : externalItems));
  }, [externalItems]);

  // other products that go with what is in the cart
  const [related, setRelated] = useState<Product[]>([]);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const slugSignature = [...new Set(cartItems.map(i => i.slug).filter((s): s is string => !!s))].sort().join(",");
  useEffect(() => {
    if (!slugSignature) { setRelated([]); return; }
    let cancelled = false;
    cartRelatedAction(slugSignature.split(",")).then(items => { if (!cancelled) setRelated(items); });
    return () => { cancelled = true; };
  }, [slugSignature]);

  useEffect(() => {
    if (isInitialCartItemsEffect.current) {
      isInitialCartItemsEffect.current = false;
      return;
    }
    onItemsChange?.(cartItems);
  }, [cartItems, onItemsChange]);

  // Show modal on mount and lock background scroll, clean up on unmount
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    dialog?.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  // When closing, wait for slide-out animation to finish before calling onClose
  useEffect(() => {
    if (!closing) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      onClose();
      if (checkoutRequested) navigateAfterClose(() => router.push("/checkout"));
    }, prefersReducedMotion ? 0 : 400);
    return () => window.clearTimeout(timer);
  }, [closing, checkoutRequested, onClose, router]);

  const handleClose = () => {
    setClosing(true);
  };
  useBackClose(handleClose);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // The shop is asked about every line (still sold here? in stock? today's price? dressing still offered?) whenever the cart opens or its lines change.
  const [checks, setChecks] = useState<Record<string, CartLineCheck>>({});
  const [checking, setChecking] = useState(false);
  const lineKey = (item: CartItem) => `${item.variantId}|${item.cuttingTypeId ?? ""}`;
  const checkSignature = [...new Set(cartItems.filter(i => i.variantId).map(lineKey))].sort().join(",");
  useEffect(() => {
    if (!checkSignature) { setChecks({}); return; }
    let cancelled = false;
    setChecking(true);
    checkCartAction(checkSignature.split(",").map(k => { const [variantId, cut] = k.split("|"); return { variantId, cuttingTypeId: cut || null }; })).then(result => {
      if (cancelled) return;
      setChecking(false);
      if (result) setChecks(Object.fromEntries(result.map(r => [`${r.variantId}|${r.cuttingTypeId ?? ""}`, r])));
    });
    return () => { cancelled = true; };
  }, [checkSignature]);

  type LineStatus = { kind: "ok" | "price" | "blocked"; message?: string; newPrice?: number; newOriginal?: number; link?: boolean; notify?: boolean };
  const statusOf = (item: CartItem): LineStatus => {
    const c = item.variantId ? checks[lineKey(item)] : undefined;
    if (!c) return { kind: "ok" };
    if (c.state === "unavailable") return { kind: "blocked", message: "No longer available in your city." };
    if (c.state === "out_of_stock") return { kind: "blocked", message: "Out of stock right now.", link: true, notify: true };
    if (c.state === "upcoming") return { kind: "blocked", message: `Not available yet, expected ${c.availableFromLabel ?? "soon"}.`, link: true, notify: true };
    if (c.dressingRequired && !c.dressing) return { kind: "blocked", message: "This product now needs a dressing type. Choose one on its page.", link: true };
    if (c.dressing && !c.dressing.offered) return { kind: "blocked", message: "This dressing type is no longer offered.", link: true };
    const unit = Math.round((c.pricePaisa ?? 0) / 100) + (c.dressing ? Math.round(c.dressing.chargePaisa / 100) : 0);
    if (c.pricePaisa !== undefined && unit !== item.price) {
      return { kind: "price", newPrice: unit, newOriginal: Math.round((c.mrpPaisa ?? 0) / 100) + (c.dressing ? Math.round(c.dressing.chargePaisa / 100) : 0),
        message: unit > item.price ? `Price went up from ${currencySymbol} ${item.price} to ${currencySymbol} ${unit}.` : `Good news, the price dropped from ${currencySymbol} ${item.price} to ${currencySymbol} ${unit}.` };
    }
    return { kind: "ok" };
  };
  const applyPrice = (id: string) => setCartItems(prev => prev.map(item => {
    if (item.id !== id) return item;
    const s = statusOf(item);
    return s.kind === "price" ? { ...item, price: s.newPrice!, originalPrice: s.newOriginal || s.newPrice! } : item;
  }));
  const statuses = new Map(cartItems.map(i => [i.id, statusOf(i)] as const));
  const orderable = cartItems.filter(i => statuses.get(i.id)?.kind === "ok");
  const unresolved = cartItems.length - orderable.length;

  const totalAmount = orderable.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = orderable.reduce(
    (sum, item) => sum + Math.max(0, (item.originalPrice ?? item.price) - item.price) * item.quantity,
    0
  );
  const dressingTotal = orderable.reduce((sum, item) => sum + (item.dressingCharge ?? 0) * item.quantity, 0);

  const handleCheckoutClick = () => {
    if (unresolved > 0 || checking || !orderable.length) return;
    onCheckout?.(orderable, totalAmount);
    window.sessionStorage.setItem("tazahat-checkout-items", JSON.stringify(orderable));
    setCheckoutRequested(true);
    setClosing(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className={`cart-sidebar-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="cart-sidebar-panel">
        {/* Fixed Header */}
        <header className="cart-header">
          <button
            type="button"
            className="cart-close-btn"
            aria-label="Close cart"
            onClick={handleClose}
            autoFocus
          >
            {/* Right arrow like AddToCart */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>

          <h2 id={titleId} className="cart-header-title">
            My Cart
          </h2>

          {totalItemsCount > 0 && (
            <span className="cart-header-count">
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
            </span>
          )}
        </header>

        {/* Scrollable Middle Section (Hidden Scrollbar) */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" />
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven&apos;t added any fresh items to your cart yet.</p>
              <button type="button" className="cart-reset-btn" onClick={handleClose}>
                Start shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list" role="list">
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className={`cart-item-card${statuses.get(item.id)?.kind === "blocked" ? " is-blocked" : ""}`}
                  role="listitem"
                >
                  {/* Left: Product Image */}
                  <div className="cart-item-image-wrap">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="cart-item-image"
                      unoptimized={isRemoteImage(item.image)}
                      onError={fallbackImage}
                    />
                  </div>

                  {/* Right: Product Details & Controls */}
                  <div className="cart-item-content">
                    {/* Top Row: Name and Delete Icon */}
                    <div className="cart-item-top-row">
                      <div className="cart-item-name-group">
                        <h3 className="cart-item-name">{item.name}</h3>
                        {item.weight && (
                          <span className="cart-item-weight">{item.weight}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="cart-item-delete-btn"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.id)}
                      >
                        {/* Trash Icon */}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>

                    {statuses.get(item.id)?.message && (() => {
                      const s = statuses.get(item.id)!;
                      return (
                        <div className={`cart-item-notice is-${s.kind}`} role="status">
                          <span>{s.message}</span>
                          <span className="cart-item-notice-actions">
                            {s.kind === "price" && <button type="button" onClick={() => applyPrice(item.id)}>Update price</button>}
                            {s.link && item.slug && <Link href={`/${encodeURIComponent(item.slug)}`} onClick={handleClose}>{s.notify ? "Notify me" : "Open product"}</Link>}
                            {s.kind !== "ok" && s.kind !== "price" && <button type="button" onClick={() => removeItem(item.id)}>Remove</button>}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Bottom Row: Qty label, -/+ buttons, Price */}
                    <div className="cart-item-bottom-row">
                      <div className="cart-item-qty-section">
                        <span className="cart-item-qty-text">
                          qty: {item.quantity}
                        </span>

                        <div
                          className="cart-qty-buttons"
                          role="group"
                          aria-label={`Quantity adjustment for ${item.name}`}
                        >
                          <button
                            type="button"
                            className="cart-qty-btn cart-qty-minus"
                            aria-label="Decrease quantity"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <button
                            type="button"
                            className="cart-qty-btn cart-qty-plus"
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.quantity >= 99}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-price-wrap">
                        <strong className="cart-item-price">
                          {currencySymbol}{" "}
                          {item.price * item.quantity}
                        </strong>
                        {item.quantity > 1 && (
                          <small className="cart-item-unit-price">
                            ({currencySymbol} {item.price} each)
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {related.length > 0 && (
                <section className="cart-related" aria-label="You may also like">
                  <h3>You may also like</h3>
                  <div className="cart-related-row">
                    {related.map(product => (
                      <article className="cart-related-card" key={product.id}>
                        <div className="cart-related-image">
                          <Image src={product.image} alt={product.name} fill sizes="120px" unoptimized={isRemoteImage(product.image)} onError={fallbackImage} />
                        </div>
                        <h4 title={product.name}>{product.name}</h4>
                        <span className="cart-related-price">{currencySymbol} {product.price}</span>
                        <button type="button" onClick={() => setVariantProduct(product)}>Add</button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {variantProduct && (
          <Variant
            product={variantProduct}
            currency="INR"
            onClose={() => setVariantProduct(null)}
            onGoToCart={(item: CartItem) => {
              window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
              setVariantProduct(null);
            }}
          />
        )}

        {/* Checkout action */}
        {cartItems.length > 0 && (
          <footer className="cart-footer">
            <button
              type="button"
              className="cart-details-toggle"
              aria-label={priceDetailsOpen ? "Hide price details" : "Show price details"}
              aria-expanded={priceDetailsOpen}
              onClick={() => setPriceDetailsOpen(open => !open)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className={`cart-price-details${priceDetailsOpen ? " is-open" : ""}`} aria-hidden={!priceDetailsOpen}>
              <div className="cart-price-details-inner">
                <h3>Estimated Price Details</h3>
                <div className="cart-price-row"><span>Total ({totalItemsCount} {totalItemsCount === 1 ? "item" : "items"})</span><span>{currencySymbol} {totalAmount.toFixed(2)}</span></div>
                <div className="cart-price-row cart-price-discount"><span>Discount</span><span>−{currencySymbol} {discountAmount.toFixed(2)}</span></div>
                <div className="cart-price-row cart-price-discount"><span>Dressing Price</span><span>{currencySymbol} {dressingTotal.toFixed(2)}</span></div>
                <div className="cart-price-row cart-price-total"><strong>Total Amount</strong><strong>{currencySymbol} {totalAmount.toFixed(2)}</strong></div>
              </div>
            </div>
            <button
              type="button"
              className="cart-checkout-btn"
              disabled={checking || unresolved > 0 || !orderable.length}
              onClick={handleCheckoutClick}
            >
              <span className="cart-checkout-text">{checking ? "Checking your items…" : unresolved > 0 ? `Resolve ${unresolved} ${unresolved === 1 ? "item" : "items"} to continue` : "Proceed to checkout"}</span>
              <span className="cart-checkout-price">
                {currencySymbol}{" "}
                {totalAmount}
              </span>
            </button>
          </footer>
        )}
      </div>
    </dialog>
  );
}
