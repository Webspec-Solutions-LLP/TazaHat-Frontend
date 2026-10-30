"use client";

import { useEffect, useRef, useState, useId } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./Cart.css";
import { fallbackImage, isRemoteImage } from "@/lib/api";

export type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  weight?: string;
  quantity: number;
};

export interface CartProps {
  onClose: () => void;
  items?: CartItem[];
  onItemsChange?: (items: CartItem[]) => void;
  currencySymbol?: string;
  onCheckout?: (items: CartItem[], total: number) => void;
}

const DEFAULT_ITEMS: CartItem[] = [
  {
    id: "katla-fish",
    name: "Katla Fish",
    image: "/images/products/product--2.png",
    price: 499,
    originalPrice: 599,
    weight: "1 kg",
    quantity: 1,
  },
  {
    id: "rohu-fish",
    name: "Rohu Fish - Fresh",
    image: "/images/products/product--2.png",
    price: 360,
    originalPrice: 420,
    weight: "500 g",
    quantity: 1,
  },
  {
    id: "chicken-curry-cut",
    name: "Chicken Curry Cut",
    image: "/images/products/product--1.png",
    price: 440,
    originalPrice: 500,
    weight: "1 kg",
    quantity: 1,
  },
];

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
  const [cartItems, setCartItems] = useState<CartItem[]>(
    externalItems !== undefined ? externalItems : DEFAULT_ITEMS
  );
  const isInitialCartItemsEffect = useRef(true);
  const titleId = useId();

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
      if (checkoutRequested) router.push("/checkout");
    }, prefersReducedMotion ? 0 : 400);
    return () => window.clearTimeout(timer);
  }, [closing, checkoutRequested, onClose, router]);

  const handleClose = () => {
    setClosing(true);
  };

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

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const discountAmount = cartItems.reduce(
    (sum, item) => sum + Math.max(0, (item.originalPrice ?? item.price) - item.price) * item.quantity,
    0
  );

  const handleCheckoutClick = () => {
    onCheckout?.(cartItems, totalAmount);
    window.sessionStorage.setItem("tazahat-checkout-items", JSON.stringify(cartItems));
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
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven&apos;t added any fresh items to your cart yet.</p>
              <button
                type="button"
                className="cart-reset-btn"
                onClick={() => setCartItems(DEFAULT_ITEMS)}
              >
                Reset Demo Items
              </button>
            </div>
          ) : (
            <div className="cart-items-list" role="list">
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className="cart-item-card"
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
            </div>
          )}
        </div>

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
                <div className="cart-price-row cart-price-discount"><span>Dressing Price</span><span>{currencySymbol} 0.00</span></div>
                <div className="cart-price-row cart-price-total"><strong>Total Amount</strong><strong>{currencySymbol} {totalAmount.toFixed(2)}</strong></div>
              </div>
            </div>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckoutClick}
            >
              <span className="cart-checkout-text">Proceed to checkout</span>
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
