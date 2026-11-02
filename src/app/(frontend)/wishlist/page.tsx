"use client";

import { useWishlistProducts } from "@/lib/useWishlistProducts";
import { ProductGridSkeleton } from "@/components/skeleton/Skeletons";

import PackAction, { StockRibbon, firstOrderable } from "@/components/availability/PackAction";
import type { Product } from "@/lib/api";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCart from "@/components/modals/AddToCart/AddToCart";
import Variant from "@/components/modals/variant/Variant";
import type { CartItem } from "@/components/modals/cart/Cart";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import { toggleWishlistId } from "@/lib/wishlist";
import "./Wishlist.css";
import VariantChips from "@/components/products/VariantChips";

const textMap: Record<SupportedLang, typeof englishText> = { en: englishText, bn: bengaliText, hi: hindiText };

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
  const [currentLang] = useLanguage();
  const t = textMap[currentLang] || englishText;
  const money = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: t.currency, maximumFractionDigits: 0 }), [t.currency]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  // the wishlist is kept in the browser; its products come from the shop for the chosen city
  const { products, loading, count } = useWishlistProducts();
  const toggleProduct = (productId: string) => toggleWishlistId(productId);

  return (
    <section className="wishlist-page" aria-labelledby="wishlist-heading" lang={t.language}>
      <div className="wishlist-container">
        <header className="wishlist-heading">
          <div className="wishlist-heading-copy">
            <span className="wishlist-heading-icon"><HeartIcon /></span>
            <div>
              <h1 id="wishlist-heading">{t.heading}</h1>
              <p>{t.subheading}</p>
            </div>
          </div>
          <span className="wishlist-count" aria-live="polite">
            {products.length} {products.length === 1 ? t.item : t.items}
          </span>
        </header>

        {loading ? (
          <ProductGridSkeleton count={Math.min(count, 10)} heading={false} label="Loading your wishlist" />
        ) : products.length ? (
          <div className="wishlist-grid">
            {products.map((product) => {
              const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice, inStock: true }];
              const initialVariant = firstOrderable(variants, Math.max(0, variants.findIndex(variant => variant.price === product.price)));
              const selectedIndex = variantIndexes[product.id] ?? initialVariant;
              const variant = variants[selectedIndex] ?? variants[0];
              const discount = variant.originalPrice > 0
                ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100))
                : 0;
              const description = t.description.replace("{name}", product.name);
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
                    <StockRibbon pack={variant} />
          <span className="product-discount-badge">
                      {t.discount.replace("{percent}", String(discount))}
                    </span>
                    <span
                      className="product-image-rating"
                      aria-label={t.rating
                        .replace("{rating}", String(product.rating))
                        .replace("{reviews}", String(product.reviews))}
                    >
                      ★ {product.rating}
                    </span>
                    <button
                      type="button"
                      className="product-save"
                      aria-pressed="true"
                      aria-label={t.removeAria.replace("{name}", product.name)}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <HeartIcon />
                    </button>
                  </div>
                  <h3><Link href={`/${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
                  <p className="product-description" title={description}>{description}</p>
                  <div className="product-pricing">
                    <strong>{money.format(variant.price)}</strong>
                    <del>{money.format(variant.originalPrice)}</del>
                  </div>
                  <VariantChips name={product.name} variants={variants} selected={selectedIndex} onSelect={index => setVariantIndexes(current => ({ ...current, [product.id]: index }))} onMore={() => setVariantProduct(product)} />
                  <div className="product-card-actions">
                    <PackAction pack={variant} className="product-details-button" onAdd={() => setVariantProduct(product)}><CartIcon />{t.addToCart}</PackAction>
                    <button className="product-quick-view" type="button" aria-label={t.quickViewAria.replace("{name}", product.name)} onClick={() => setSelectedProduct(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="wishlist-empty">
            <span className="wishlist-empty-icon"><HeartIcon /></span>
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyDescription}</p>
            <Link className="wishlist-browse-link" href="/products">{t.browseProducts}</Link>
          </div>
        )}
      </div>

      {selectedProduct && (
        <AddToCart
          key={selectedProduct.id}
          product={selectedProduct}
          locale={t.locale}
          currency={t.currency}
          saved={products.some((p) => p.id === selectedProduct.id)}
          onToggleWishlist={() => toggleProduct(selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onOpenProduct={setSelectedProduct}
        />
      )}
      {variantProduct && (
        <Variant
          product={variantProduct}
          currency={t.currency}
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
