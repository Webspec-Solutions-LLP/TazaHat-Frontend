"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import productCatalog from "@/components/products/english.json";
import type { CompareProduct } from "../compareList/CompareList";
import "./CompareDetails.css";

export interface CompareDetailsProps {
  products: CompareProduct[];
  onClose: () => void;
  onBackToList?: () => void;
}

export default function CompareDetails({
  products,
  onClose,
  onBackToList,
}: CompareDetailsProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [addedA, setAddedA] = useState(false);
  const [addedB, setAddedB] = useState(false);
  const titleId = useId();

  const productA = products[0];
  const productB = products[1];

  const catalogA = productCatalog.products.find(p => p.id === productA?.id);
  const catalogB = productCatalog.products.find(p => p.id === productB?.id);

  const closeWithAnimation = useCallback(
    (callback?: () => void) => {
      if (isClosing) return;
      setIsClosing(true);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        if (callback) {
          callback();
        } else {
          onClose();
        }
      }, reduceMotion ? 0 : 220);
    },
    [isClosing, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWithAnimation();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWithAnimation]);

  const parseNumber = (val?: number | string): number => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const priceA = parseNumber(productA?.price);
  const priceB = parseNumber(productB?.price);
  const origPriceA = parseNumber(productA?.originalPrice);
  const origPriceB = parseNumber(productB?.originalPrice);

  const ratingA = Number(productA?.rating ?? catalogA?.rating ?? 0);
  const ratingB = Number(productB?.rating ?? catalogB?.rating ?? 0);
  const reviewsA = productA?.reviews ?? catalogA?.reviews ?? 7;
  const reviewsB = productB?.reviews ?? catalogB?.reviews ?? 7;

  const categoryA = catalogA?.category || "Fresh Grocery";
  const categoryB = catalogB?.category || "Fresh Grocery";
  const weightA = productA?.unit || catalogA?.weight || "1 kg";
  const weightB = productB?.unit || catalogB?.weight || "1 kg";

  const savingsA = origPriceA > priceA ? origPriceA - priceA : 0;
  const savingsB = origPriceB > priceB ? origPriceB - priceB : 0;

  const handleAddToCart = (product: CompareProduct, which: "A" | "B") => {
    const numericPrice = parseNumber(product.price);
    const numericOrigPrice = parseNumber(product.originalPrice);
    window.dispatchEvent(
      new CustomEvent("tazahat:add-cart-item", {
        detail: {
          id: product.id,
          name: product.name,
          image: product.image,
          price: numericPrice,
          originalPrice: numericOrigPrice > numericPrice ? numericOrigPrice : undefined,
          weight: product.unit || "1 kg",
          quantity: 1,
        },
      })
    );

    if (which === "A") {
      setAddedA(true);
      setTimeout(() => setAddedA(false), 1600);
    } else {
      setAddedB(true);
      setTimeout(() => setAddedB(false), 1600);
    }
  };

  if (!productA || !productB) {
    return null;
  }

  return (
    <div
      className={`compare-details-backdrop${isClosing ? " is-closing" : ""}`}
      onClick={event => {
        if (event.target === event.currentTarget) closeWithAnimation();
      }}
      role="presentation"
    >
      <div
        className="compare-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <header className="compare-details-header">
          <div className="compare-details-header-title">
            <span className="compare-details-header-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3l4 4-4 4" />
                <path d="M20 7H4" />
                <path d="M8 21l-4-4 4-4" />
                <path d="M4 17h16" />
              </svg>
            </span>
            <div>
              <div className="compare-details-title-row">
                <h2 id={titleId}>Compare Products</h2>
                <span className="compare-details-count-pill">2 items</span>
              </div>
              <p>Detailed side-by-side comparison to help you choose</p>
            </div>
          </div>
          <button
            type="button"
            className="compare-details-close"
            onClick={() => closeWithAnimation()}
            aria-label="Close comparison details"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Content Body - Hidden Scrollbar */}
        <div className="compare-details-body">
          {/* Top Products Cards Side-by-Side */}
          <div className="compare-products-grid">
            {/* Product A Card */}
            <div className="compare-product-card">
              <div className="compare-product-img-wrap">
                <Image
                  src={productA.image}
                  alt={productA.name}
                  fill
                  sizes="140px"
                  className="compare-product-single-img"
                />
                {savingsA > 0 && (
                  <span className="compare-badge-savings">Save ₹{savingsA}</span>
                )}
              </div>
              <h3 className="compare-product-title" title={productA.name}>
                {productA.name}
              </h3>
              {ratingA > 0 && (
              <div className="compare-rating-pill">
                <span className="compare-star">★</span>
                <strong>{ratingA.toFixed(1)}</strong>
                <span>({reviewsA} reviews)</span>
                {ratingA > ratingB && (
                  <span className="compare-winner-pill">Higher Rated</span>
                )}
              </div>
              )}
              <div className="compare-price-pill">
                <strong className="compare-main-price">₹{priceA}</strong>
                {origPriceA > priceA && <del>₹{origPriceA}</del>}
                <span className="compare-pack-unit">/ {weightA}</span>
                {priceA < priceB && (
                  <span className="compare-value-pill">Better Price</span>
                )}
              </div>
              <div className="compare-card-actions">
                <button
                  type="button"
                  className={`compare-cart-btn${addedA ? " is-added" : ""}`}
                  onClick={() => handleAddToCart(productA, "A")}
                >
                  {addedA ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Added!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>
                <Link
                  href={`/productDetails?id=${productA.id}`}
                  className="compare-view-link"
                  onClick={() => closeWithAnimation()}
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Middle VS separator */}
            <div className="compare-vs-divider" aria-hidden="true">
              <span className="compare-vs-badge">VS</span>
            </div>

            {/* Product B Card */}
            <div className="compare-product-card">
              <div className="compare-product-img-wrap">
                <Image
                  src={productB.image}
                  alt={productB.name}
                  fill
                  sizes="140px"
                  className="compare-product-single-img"
                />
                {savingsB > 0 && (
                  <span className="compare-badge-savings">Save ₹{savingsB}</span>
                )}
              </div>
              <h3 className="compare-product-title" title={productB.name}>
                {productB.name}
              </h3>
              {ratingB > 0 && (
              <div className="compare-rating-pill">
                <span className="compare-star">★</span>
                <strong>{ratingB.toFixed(1)}</strong>
                <span>({reviewsB} reviews)</span>
                {ratingB > ratingA && (
                  <span className="compare-winner-pill">Higher Rated</span>
                )}
              </div>
              )}
              <div className="compare-price-pill">
                <strong className="compare-main-price">₹{priceB}</strong>
                {origPriceB > priceB && <del>₹{origPriceB}</del>}
                <span className="compare-pack-unit">/ {weightB}</span>
                {priceB < priceA && (
                  <span className="compare-value-pill">Better Price</span>
                )}
              </div>
              <div className="compare-card-actions">
                <button
                  type="button"
                  className={`compare-cart-btn${addedB ? " is-added" : ""}`}
                  onClick={() => handleAddToCart(productB, "B")}
                >
                  {addedB ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Added!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>
                <Link
                  href={`/productDetails?id=${productB.id}`}
                  className="compare-view-link"
                  onClick={() => closeWithAnimation()}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>

          {/* Compact Feature Comparison Table */}
          <section className="compare-table-section">
            <div className="compare-table-header-bar">
              <h4 className="compare-table-heading">Attribute Comparison</h4>
              <span className="compare-table-sub">Side-by-side specifications</span>
            </div>
            <div className="compare-table">
              {/* Table Column Titles */}
              <div className="compare-table-row compare-table-col-header">
                <span className="compare-col-label">Attribute</span>
                <span className="compare-col-val compare-header-val" title={productA.name}>
                  {productA.name}
                </span>
                <span className="compare-col-val compare-header-val" title={productB.name}>
                  {productB.name}
                </span>
              </div>

              {/* Price row */}
              <div className="compare-table-row">
                <span className="compare-col-label">Selling Price</span>
                <span className={`compare-col-val font-highlight${priceA < priceB ? " is-winner" : ""}`}>
                  ₹{priceA}
                  {priceA < priceB && <span className="compare-cell-tag">Best Value</span>}
                </span>
                <span className={`compare-col-val font-highlight${priceB < priceA ? " is-winner" : ""}`}>
                  ₹{priceB}
                  {priceB < priceA && <span className="compare-cell-tag">Best Value</span>}
                </span>
              </div>

              {/* Weight / Unit */}
              <div className="compare-table-row">
                <span className="compare-col-label">Weight / Unit</span>
                <span className="compare-col-val">{weightA}</span>
                <span className="compare-col-val">{weightB}</span>
              </div>

              {/* Rating */}
              <div className="compare-table-row">
                <span className="compare-col-label">Customer Rating</span>
                <span className={`compare-col-val${ratingA > ratingB ? " is-winner" : ""}`}>
                  ★ {ratingA.toFixed(1)} / 5 ({reviewsA} reviews)
                  {ratingA > ratingB && <span className="compare-cell-tag tag-amber">Higher</span>}
                </span>
                <span className={`compare-col-val${ratingB > ratingA ? " is-winner" : ""}`}>
                  ★ {ratingB.toFixed(1)} / 5 ({reviewsB} reviews)
                  {ratingB > ratingA && <span className="compare-cell-tag tag-amber">Higher</span>}
                </span>
              </div>

              {/* Category */}
              <div className="compare-table-row">
                <span className="compare-col-label">Category</span>
                <span className="compare-col-val">{categoryA}</span>
                <span className="compare-col-val">{categoryB}</span>
              </div>

              {/* Freshness */}
              <div className="compare-table-row">
                <span className="compare-col-label">Freshness Promise</span>
                <span className="compare-col-val text-success">
                  <svg className="compare-check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100% Farm Fresh Daily
                </span>
                <span className="compare-col-val text-success">
                  <svg className="compare-check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100% Farm Fresh Daily
                </span>
              </div>

              {/* Hygiene & Packaging */}
              <div className="compare-table-row">
                <span className="compare-col-label">Packaging</span>
                <span className="compare-col-val">Vacuum-sealed &amp; Hygienic</span>
                <span className="compare-col-val">Vacuum-sealed &amp; Hygienic</span>
              </div>

              {/* Delivery */}
              <div className="compare-table-row">
                <span className="compare-col-label">Delivery</span>
                <span className="compare-col-val">Same-Day Express Dispatch</span>
                <span className="compare-col-val">Same-Day Express Dispatch</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="compare-details-footer">
          {onBackToList && (
            <button
              type="button"
              className="compare-details-back-btn"
              onClick={() => closeWithAnimation(onBackToList)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to List
            </button>
          )}
          <button
            type="button"
            className="compare-details-done-btn"
            onClick={() => closeWithAnimation()}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
