"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import productsText from "../priceList/english.json";
import "./ProductDetails.css";
import Products from "@/components/products/Products";

const money = new Intl.NumberFormat(productsText.locale, { style: "currency", currency: productsText.currency, maximumFractionDigits: 0 });

function Icon({ name }: { name: "fish" | "leaf" | "shield" | "flask" | "box" | "cart" | "heart" | "minus" | "plus" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    fish: <><path d="M3 12C8 2 17 5 20 12c-3 7-12 10-17 0Zm0 0-2-4v8l2-4Z"/><circle cx="16" cy="11" r=".8"/></>,
    leaf: <><path d="M4 20C1 6 12 3 21 3c0 12-5 20-17 17ZM4 20 16 8"/><path d="m9 15 5-5"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    flask: <><path d="M9 3h6m-5 0v6l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V3"/><path d="M8 15h8"/></>,
    box: <><path d="m12 2 10 5v10l-10 5-10-5V7l10-5ZM2 7l10 5 10-5M12 12v10M7 4l10 5"/></>,
    cart: <><path d="M2 3h3l3 13h11l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    minus: <path d="M5 12h14"/>, plus: <path d="M12 5v14M5 12h14" />,
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
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
  const [dressingType, setDressingType] = useState("");
  const [specialInstruction, setSpecialInstruction] = useState("");
  const weightOptions = product.unit.toLowerCase() === "kg"
    ? kilogramWeights
    : [{ label: product.unit, multiplier: 1 }];
  const activeWeightIndex = Math.min(selectedWeightIndex, weightOptions.length - 1);
  const selectedWeight = weightOptions[activeWeightIndex];
  const selectedPrice = Math.round(product.price * selectedWeight.multiplier);
  const selectedOriginalPrice = Math.round(product.originalPrice * selectedWeight.multiplier);
  const pricePerUnit = product.unit.toLowerCase() === "kg"
    ? product.price
    : Math.round(product.price / selectedWeight.multiplier);
  const gallery = [product.image, ...["/images/products/product--2.png", "/images/products/product16.png", "/images/products/product18.png", "/images/products/product17.png"].filter(src => src !== product.image)];

  return <main className="product-details-page">
    <div className="product-details-shell">
      <div className="pd-layout">
        <section className="pd-gallery" aria-label="Product images">
          <div className="pd-thumbnails">{gallery.map((src, index) => <button key={`${src}-${index}`} className={activeImage === src ? "is-active" : ""} onClick={() => setActiveImage(src)} aria-label={`Show product image ${index + 1}`}><Image src={src} alt="" fill sizes="76px" /></button>)}<span className="pd-thumb-more" aria-hidden="true">⌄</span></div>
          <div className="pd-main-image"><Image src={activeImage} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 40vw" /><span className="pd-fresh">🐟 &nbsp;Fresh Catch</span><span className="pd-natural">◉ &nbsp;100% Fresh &amp; Natural</span></div>
        </section>
        <div className="pd-right-column">
          <div className="pd-right-overview">
        <section className="pd-info" aria-labelledby="pd-title">
          <h1 id="pd-title">{product.name}</h1>
          <div className="pd-rating" aria-label="Rated 4.5 out of 5">★★★★◐ <span>(7 Reviews)</span></div>
          <p className="pd-description">Fresh and tasty {product.name}, carefully selected for quality and freshness. Perfect for your favorite family recipes.</p>
          <div className="pd-price-row"><del>{money.format(selectedOriginalPrice)}</del><strong>{money.format(selectedPrice)}</strong><span>({money.format(pricePerUnit)}/{product.unit})</span></div>
          <fieldset className="pd-variant-picker">
            <legend><strong>Weight / Pack size</strong><span>{money.format(pricePerUnit)} / {product.unit}</span></legend>
            <div className="pd-weights">{weightOptions.map((weight, index) => <label key={weight.label} className={`pd-weight-option${activeWeightIndex === index ? " is-selected" : ""}`}>
              <input type="radio" name={`weight-${product.id}`} value={weight.label} checked={activeWeightIndex === index} onChange={() => setSelectedWeightIndex(index)} />
              <span className="pd-weight-option-card"><span className="pd-weight-option-heading"><strong>{weight.label}</strong><span className="pd-weight-check" aria-hidden="true">✓</span></span><strong className="pd-weight-price">{money.format(Math.round(product.price * weight.multiplier))}</strong><small>{money.format(pricePerUnit)} / {product.unit}</small></span>
            </label>)}</div>
          </fieldset>
          {!["Produce", "Dairy", "Pantry"].includes(product.category) && <label className="pd-field"><span>Dressing Type</span><select value={dressingType} onChange={event => setDressingType(event.target.value)}><option value="">Select Dressing Type</option><option>Whole / Uncut</option><option>Cleaned</option><option>Curry Cut</option></select></label>}
          <label className="pd-field"><span>Special instruction</span><input type="text" value={specialInstruction} onChange={event => setSpecialInstruction(event.target.value)} placeholder="Any preferences? (optional)" maxLength={250} /></label>
          <div className="pd-control-label">Quantity :</div>
          <div className="pd-quantity"><button aria-label="Decrease quantity" onClick={() => setQuantity(n => Math.max(1, n - 1))}><Icon name="minus" /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(n => n + 1)}><Icon name="plus" /></button></div>
          <div className="pd-actions"><button className="pd-add"><Icon name="cart" /> Add to Cart</button><button className="pd-wishlist"><Icon name="heart" /> Add to Wishlist</button></div>
        </section>
        <aside className="pd-trust" aria-label="Product quality promises">
          <ul>{trustItems.map(item => <li key={item.title}><span className="pd-trust-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span></li>)}</ul>
          <div className="pd-river-art"><strong>Fresh<br/>From River<br/>To Your Table</strong><span>🐟　🌿<br/>〰️〰️〰️</span></div>
        </aside>
      </div>
          <section className="pd-extra" aria-label="More product information">
        <nav className="pd-tabs" aria-label="Product information tabs">
          {[{ id: "description", label: "Description", icon: "▤" }, { id: "reviews", label: "Reviews (7)", icon: "☆" }, { id: "shipping", label: "Shipping", icon: "▰" }, { id: "related", label: "Related Products", icon: "↗" }].map(tab => <button type="button" key={tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}><span aria-hidden="true">{tab.icon}</span>{tab.label}</button>)}
        </nav>
        {activeTab === "description" && <div className="pd-tab-content"><div><h2>About This Product</h2><p>{product.name} is carefully selected for quality and freshness. It has a delicious taste and is perfect for everyday meals and family recipes.</p></div><aside><h3>Key Features</h3><ul><li>100% Fresh &amp; Natural</li><li>Carefully selected quality</li><li>Freshness you can taste</li><li>Packed with care</li><li>Great for everyday meals</li></ul></aside></div>}
        {activeTab === "reviews" && <div className="pd-tab-content pd-tab-single"><div><h2>Customer Reviews</h2><p className="pd-review-score">★★★★★ <span>4.5 out of 5 · 7 reviews</span></p><p>Customers love the freshness and quality of this product.</p></div></div>}
        {activeTab === "shipping" && <div className="pd-tab-content pd-tab-single"><div><h2>Shipping &amp; Delivery</h2><p>We carefully pack every order to keep it fresh. Delivery availability and timing depend on your location.</p></div></div>}
        {activeTab === "related" && <div className="pd-tab-content pd-tab-single"><div><h2>Related Products</h2><p>Explore more fresh picks from TazaHaat in the product catalogue.</p></div></div>}
          </section>
        </div>
      </div>
    </div>

    <Products />
  </main>;
}
