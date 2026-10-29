"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCart from "@/components/modals/AddToCart/AddToCart";
import Variant from "@/components/modals/variant/Variant";
import type { CartItem } from "@/components/modals/cart/Cart";
import catalog from "@/components/products/english.json";
import {
  getServerWishlistSnapshot,
  getWishlistSnapshot,
  parseWishlistSnapshot,
  subscribeToWishlist,
  toggleWishlistId,
} from "@/lib/wishlist";
import "./Wishlist.css";

type Product = (typeof catalog.products)[number];
const money = new Intl.NumberFormat(catalog.locale, {
  style: "currency",
  currency: catalog.currency,
  maximumFractionDigits: 0,
});

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
    </svg>
  );
}

export default function WishlistPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const savedIdsSnapshot = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistSnapshot,
    getServerWishlistSnapshot,
  );
  const savedIds = parseWishlistSnapshot(savedIdsSnapshot);
  const products = catalog.products.filter((product) => savedIds.includes(product.id));
  const toggleProduct = (productId: string) => toggleWishlistId(productId);

  return (
    <section className="wishlist-page" aria-labelledby="wishlist-heading" lang={catalog.language}>
      <div className="wishlist-container">
        <header className="wishlist-heading">
          <div className="wishlist-heading-copy">
            <span className="wishlist-heading-icon"><HeartIcon /></span>
            <div>
              <h1 id="wishlist-heading">My Wishlist</h1>
              <p>Your favourite fresh picks, all in one place.</p>
            </div>
          </div>
          <span className="wishlist-count" aria-live="polite">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </header>

        {products.length ? (
          <div className="wishlist-grid">
            {products.map((product) => {
              const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
              const initialVariant = Math.max(0, variants.findIndex(variant => variant.price === product.price));
              const selectedIndex = variantIndexes[product.id] ?? initialVariant;
              const variant = variants[selectedIndex] ?? variants[0];
              const discount = variant.originalPrice > 0
                ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100))
                : 0;
              const description = `${product.name} selected for freshness and quality, ready for your everyday meals.`;
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 560px) 45vw, (max-width: 1050px) 25vw, 220px"
                      draggable={false}
                    />
                    <span className="product-discount-badge">
                      {catalog.discount.replace("{percent}", String(discount))}
                    </span>
                    <span
                      className="product-image-rating"
                      aria-label={catalog.rating
                        .replace("{rating}", String(product.rating))
                        .replace("{reviews}", String(product.reviews))}
                    >
                      ★ {product.rating}
                    </span>
                    <button
                      type="button"
                      className="product-save"
                      aria-pressed="true"
                      aria-label={`Remove ${product.name} from wishlist`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <HeartIcon />
                    </button>
                  </div>
                  <h3><Link href={`/productDetails?id=${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
                  <p className="product-description" title={description}>{description}</p>
                  <div className="product-pricing">
                    <strong>{money.format(variant.price)}</strong>
                    <del>{money.format(variant.originalPrice)}</del>
                  </div>
                  <div className="product-variant-wrap">
                    <button type="button" className="product-variant-trigger" aria-haspopup="listbox" aria-expanded={openVariant === product.id} onClick={() => setOpenVariant(current => current === product.id ? null : product.id)}>
                      <span>{variant.label}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
                    </button>
                    {openVariant === product.id && <div className="product-variant-menu" role="listbox" aria-label={`Choose size for ${product.name}`}>
                      {variants.map((option, index) => <button type="button" role="option" aria-selected={index === selectedIndex} key={`${product.id}-${option.label}`} onClick={() => { setVariantIndexes(current => ({ ...current, [product.id]: index })); setOpenVariant(null); }}><span>{option.label}</span><span>{money.format(option.price)}</span></button>)}
                    </div>}
                  </div>
                  <div className="product-card-actions">
                    <button className="product-details-button" type="button" onClick={() => setVariantProduct(product)}><CartIcon /> Add to Cart</button>
                    <button className="product-quick-view" type="button" aria-label={`View ${product.name} details`} onClick={() => setSelectedProduct(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="wishlist-empty">
            <span className="wishlist-empty-icon"><HeartIcon /></span>
            <h2>Your wishlist is waiting for favourites</h2>
            <p>Tap the heart on any product to save it here and find it whenever you need it.</p>
            <Link className="wishlist-browse-link" href="/products">Browse products</Link>
          </div>
        )}
      </div>

      {selectedProduct && (
        <AddToCart
          key={selectedProduct.id}
          product={selectedProduct}
          locale={catalog.locale}
          currency={catalog.currency}
          saved={savedIds.includes(selectedProduct.id)}
          onToggleWishlist={() => toggleProduct(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onOpenProduct={setSelectedProduct}
        />
      )}
      {variantProduct && (
        <Variant
          product={variantProduct}
          currency={catalog.currency}
          onClose={() => setVariantProduct(null)}
          onGoToCart={(item: CartItem) => {
            window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
            setVariantProduct(null);
          }}
        />
      )}
    </section>
  );
}
