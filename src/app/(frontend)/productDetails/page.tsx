"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Products from "@/components/products/Products";
import productsText from "../priceList/english.json";
import productCards from "@/components/products/english.json";
import "./ProductDetails.css";

const money = new Intl.NumberFormat(productsText.locale, { style: "currency", currency: productsText.currency, maximumFractionDigits: 0 });
function Icon({ name }: { name: "fish" | "leaf" | "shield" | "flask" | "box" | "cart" | "heart" | "minus" | "plus" | "info" }) {
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
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const trustItems = [
  { icon: "fish" as const, title: "100% Fresh Catch", text: "Daily fresh supply" },
  { icon: "leaf" as const, title: "Naturally Sourced", text: "From clean rivers" },
  { icon: "shield" as const, title: "Hygienically Cleaned", text: "Safe for your family" },
  { icon: "flask" as const, title: "No Preservatives", text: "Pure & natural" },
  { icon: "box" as const, title: "Packed with Care", text: "Leak proof packaging" },
];

const kilogramWeights = [
  { label: "250 g", multiplier: 0.25 },
  { label: "500g", multiplier: 0.5 },
  { label: "1kg", multiplier: 1 },
];

export default function ProductDetails() {
  return (
    <Suspense fallback={<main className="product-details-page" aria-busy="true" />}>
      <ProductDetailsContent />
    </Suspense>
  );
}

function ProductDetailsContent() {
  const params = useSearchParams();
  const product = useMemo(() => productsText.products.find(item => item.id === params.get("id")) ?? productsText.products[0], [params]);
  const productCard = productCards.products.find(item => item.id === product.id);
  const relatedRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
  const [dressingType, setDressingType] = useState("");
  const [specialInstruction, setSpecialInstruction] = useState("");
  const weightOptions = productCard?.variants?.length
    ? productCard.variants.map(variant => ({ label: variant.label, multiplier: variant.price / product.price }))
    : product.unit.toLowerCase() === "kg"
      ? kilogramWeights
      : [{ label: product.unit, multiplier: 1 }];
  const activeWeightIndex = Math.min(selectedWeightIndex, weightOptions.length - 1);
  const selectedWeight = weightOptions[activeWeightIndex];
  const selectedPrice = Math.round(product.price * selectedWeight.multiplier);
  const selectedOriginalPrice = Math.round(product.originalPrice * selectedWeight.multiplier);
  const pricePerUnit = product.unit.toLowerCase() === "kg"
    ? product.price
    : Math.round(product.price / selectedWeight.multiplier);
  const categoryNames: Record<string, string> = {
    fish: "Fish & Seafood",
    meat: "Meat & Poultry",
    vegetables: "Vegetables",
    fruits: "Fruits",
    dairy: "Dairy & Eggs",
    grocery: "Grocery & Staples",
    bakery: "Snacks & Bakery",
  };
  const relatedProducts = productCards.products.filter(item =>
    item.id !== product.id && item.category === categoryNames[product.category]
  );
  const gallery = [product.image, ...["/images/products/product--2.png", "/images/products/product16.png", "/images/products/product18.png", "/images/products/product17.png"].filter(src => src !== product.image)];

  return <main className="product-details-page">
    <div className="product-details-shell">
      <div className="pd-layout">
        <div className="pd-left-column"><section className="pd-gallery" aria-label="Product images">
          <div className="pd-thumbnails">{gallery.map((src, index) => <button key={`${src}-${index}`} className={activeImage === src ? "is-active" : ""} onClick={() => setActiveImage(src)} aria-label={`Show product image ${index + 1}`}><Image src={src} alt="" fill sizes="76px" /></button>)}</div>
          <div className="pd-main-image"><Image src={activeImage} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 40vw" /><span className="pd-fresh">🐟 &nbsp;Fresh Catch</span><span className="pd-natural">◉ &nbsp;100% Fresh &amp; Natural</span></div>
        </section>
        <aside className="pd-trust" aria-label="Product quality promises">
          <h2 className="pd-trust-heading">Our Quality Promise</h2>
          <ul>{trustItems.map(item => <li key={item.title}><span className="pd-trust-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span></li>)}</ul>
          <div className="pd-river-art"><span aria-hidden="true">🐟　🌿</span></div>
        </aside>
        </div>
        <div className="pd-right-column">
          <div className="pd-right-overview">
        <section className="pd-info" aria-labelledby="pd-title">
          <h1 id="pd-title">{product.name}</h1>
          <div className="pd-rating" aria-label="Rated 4.5 out of 5">★★★★◐ <span>(7 Reviews)</span></div>
          <p className="pd-description">Fresh and tasty {product.name}, carefully selected for quality and freshness. Perfect for your favorite family recipes.</p>
          <div className="pd-price-row"><strong>{money.format(selectedPrice * quantity)}</strong><del>{money.format(selectedOriginalPrice * quantity)}</del><span>({money.format(pricePerUnit)}/{product.unit}) · {quantity} {quantity === 1 ? "item" : "items"}</span></div>
          <fieldset className="pd-variant-picker">
            <legend><strong>Weight / Pack size</strong><span>{money.format(pricePerUnit)} / {product.unit}</span></legend>
            <div className="pd-weights">{weightOptions.map((weight, index) => <label key={weight.label} className={`pd-weight-option${activeWeightIndex === index ? " is-selected" : ""}`}>
              <input type="radio" name={`weight-${product.id}`} value={weight.label} checked={activeWeightIndex === index} onChange={() => setSelectedWeightIndex(index)} />
              <span className="pd-weight-option-card"><strong>{weight.label}</strong></span>
            </label>)}</div>
          </fieldset>
          {!["Produce", "Dairy", "Pantry"].includes(product.category) && <label className="pd-field"><span>Dressing Type</span><select value={dressingType} onChange={event => setDressingType(event.target.value)}><option value="">Select Dressing Type</option><option>Whole / Uncut</option><option>Cleaned</option><option>Curry Cut</option></select></label>}
          <label className="pd-field"><span>Special instruction</span><input type="text" value={specialInstruction} onChange={event => setSpecialInstruction(event.target.value)} placeholder="Any preferences? (optional)" maxLength={250} /></label>
          <div className="pd-actions">
            <div className="pd-quantity" aria-label="Quantity">
              <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(n => Math.max(1, n - 1))}><Icon name="minus" /></button>
              <output aria-live="polite" aria-label="Quantity">{quantity}</output>
              <button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity(n => Math.min(99, n + 1))}><Icon name="plus" /></button>
            </div>
            <button type="button" className="pd-wishlist"><Icon name="heart" /> Add to Wishlist</button>
          </div>
          <div className="pd-order-note"><span><Icon name="shield" /></span><p><strong>Freshness you can trust</strong><small>Carefully selected, hygienically handled and packed fresh for delivery.</small></p></div>
        </section>
      </div>
          <section className="pd-extra" aria-label="More product information">
            <ol className="pd-info-list">
              <li><h2>Product Description</h2><p>{product.name} is selected for freshness and quality, then carefully packed to arrive ready for your kitchen. Its satisfying taste and texture make it a versatile choice for everyday meals, family recipes, and special occasions. Prepare it your way and pair it with your favorite sides and seasonings.</p><ul><li>Carefully selected quality</li><li>Packed with care</li><li>Versatile for everyday recipes</li><li>A convenient choice for family meals</li></ul></li>
              <li><h2>Shipping &amp; Delivery</h2><p>We carefully pack every order to keep it fresh. Delivery availability and timing depend on your location.</p></li>
              <li><h2>Customer Reviews</h2><p className="pd-review-score"><span aria-label="Rating: 4.5 out of 5">&#9733;&#9733;&#9733;&#9733;&#9734;</span> <span>4.5 out of 5 &middot; 4 demo reviews</span></p><ul className="pd-reviews"><li><strong>Ayesha R.</strong><span>&#9733;&#9733;&#9733;&#9733;&#9733; &middot; Fresh and carefully packed. Worked perfectly for a family dinner.</span></li><li><strong>Rafiq H.</strong><span>&#9733;&#9733;&#9733;&#9733;&#9734; &middot; Good quality and easy to prepare. Would order again.</span></li><li><strong>Moumita D.</strong><span>&#9733;&#9733;&#9733;&#9733;&#9733; &middot; Tasty, fresh, and a great fit for my usual recipes.</span></li><li><strong>Soham P.</strong><span>&#9733;&#9733;&#9733;&#9733;&#9734; &middot; Nice product and neat packaging. Arrived ready to cook.</span></li></ul></li>
            </ol>
          </section>
        </div>
      </div>
      <div ref={relatedRef} className="pd-related"><Products heading="Related Products" products={relatedProducts} showViewAll={false} layout="related" /></div>
    </div>
  </main>;
}
