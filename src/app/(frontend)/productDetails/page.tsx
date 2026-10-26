"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AddToCart from "@/components/modals/AddToCart/AddToCart";
import productsText from "../priceList/english.json";
import productCards from "@/components/products/english.json";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "./ProductDetails.css";

const money = new Intl.NumberFormat(productsText.locale, { style: "currency", currency: productsText.currency, maximumFractionDigits: 0 });
type CatalogProduct = (typeof productCards.products)[number];

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
  const descriptionRef = useRef<HTMLElement>(null);
  const relatedRef = useRef<HTMLElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.image);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
  const [dressingType, setDressingType] = useState("");
  const [specialInstruction, setSpecialInstruction] = useState("");
  const [relatedVariantIndexes, setRelatedVariantIndexes] = useState<Record<string, number>>({});
  const [relatedSaved, setRelatedSaved] = useState<string[]>([]);
  const [selectedRelated, setSelectedRelated] = useState<CatalogProduct | null>(null);
  const closeRelatedDetails = () => setSelectedRelated(null);
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
        <section className="pd-gallery" aria-label="Product images">
          <div className="pd-thumbnails">{gallery.map((src, index) => <button key={`${src}-${index}`} className={activeImage === src ? "is-active" : ""} onClick={() => setActiveImage(src)} aria-label={`Show product image ${index + 1}`}><Image src={src} alt="" fill sizes="76px" /></button>)}</div>
          <div className="pd-main-image"><Image src={activeImage} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 40vw" /><span className="pd-fresh">🐟 &nbsp;Fresh Catch</span><span className="pd-natural">◉ &nbsp;100% Fresh &amp; Natural</span></div>
        </section>
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
            <button type="button" className="pd-info-button" onClick={() => { setActiveTab("description"); descriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><Icon name="info" /> Info</button>
          </div>
          <div className="pd-order-note"><span><Icon name="shield" /></span><p><strong>Freshness you can trust</strong><small>Carefully selected, hygienically handled and packed fresh for delivery.</small></p></div>
        </section>
        <aside className="pd-trust" aria-label="Product quality promises">
          <ul>{trustItems.map(item => <li key={item.title}><span className="pd-trust-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span></li>)}</ul>
          <div className="pd-river-art"><strong>Fresh<br/>From River<br/>To Your Table</strong><span>🐟　🌿<br/>〰️〰️〰️</span></div>
        </aside>
      </div>
          <section ref={descriptionRef} className="pd-extra" aria-label="More product information">
        <nav className="pd-tabs" aria-label="Product information tabs">
          {[{ id: "description", label: "Description", icon: "▤" }, { id: "reviews", label: "Reviews (7)", icon: "☆" }, { id: "shipping", label: "Shipping", icon: "▰" }, { id: "related", label: "Related Products", icon: "↗" }].map(tab => <button type="button" key={tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}><span aria-hidden="true">{tab.icon}</span>{tab.label}</button>)}
        </nav>
        {activeTab === "description" && <div className="pd-tab-content"><div><h2>About This Product</h2><p>{product.name} is carefully selected for quality and freshness. It has a delicious taste and is perfect for everyday meals and family recipes.</p></div><aside><h3>Key Features</h3><ul><li>100% Fresh &amp; Natural</li><li>Carefully selected quality</li><li>Freshness you can taste</li><li>Packed with care</li><li>Great for everyday meals</li></ul></aside></div>}
        {activeTab === "reviews" && <div className="pd-tab-content pd-tab-single"><div><h2>Customer Reviews</h2><p className="pd-review-score">★★★★★ <span>4.5 out of 5 · 7 reviews</span></p><p>Customers love the freshness and quality of this product.</p></div></div>}
        {activeTab === "shipping" && <div className="pd-tab-content pd-tab-single"><div><h2>Shipping &amp; Delivery</h2><p>We carefully pack every order to keep it fresh. Delivery availability and timing depend on your location.</p></div></div>}
        {activeTab === "related" && <div className="pd-tab-content pd-tab-single"><div><h2>Related Products</h2><p>Browse the related products below, selected from the same category.</p><button type="button" className="pd-related-jump" onClick={() => relatedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>See related products</button></div></div>}
          </section>
          <section ref={relatedRef} className="pd-related" aria-labelledby="pd-related-title">
            <div className="pd-related-heading"><h2 id="pd-related-title">Related Products</h2></div>
            {relatedProducts.length > 0 ? <Swiper className="pd-related-slider" modules={[A11y, Keyboard, Mousewheel]} slidesPerView={2.1} spaceBetween={10} keyboard={{ enabled: true, onlyInViewport: true }} mousewheel={{ forceToAxis: true }} a11y={{ containerMessage: "Related products. Swipe or use arrow keys to explore." }} tabIndex={0}>
              {relatedProducts.map(item => {
                const itemVariants = item.variants?.length ? item.variants : [{ label: item.weight, amount: 1, unit: "pack", price: item.price, originalPrice: item.originalPrice }];
                const variantIndex = relatedVariantIndexes[item.id] ?? Math.max(0, itemVariants.findIndex(option => option.price === item.price));
                const itemVariant = itemVariants[variantIndex] ?? itemVariants[0];
                const price = itemVariant?.price ?? item.price;
                const originalPrice = itemVariant?.originalPrice ?? item.originalPrice;
                const discount = originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
                const isSaved = relatedSaved.includes(item.id);
                const description = `${item.name} selected for freshness and quality, ready for your everyday meals.`;
                return <SwiperSlide key={item.id}><article className="pd-related-card">
                  <div className="pd-related-image">
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 600px) 44vw, 220px" />
                    {discount > 0 && <span className="pd-related-discount">{discount}% OFF</span>}
                    <button className="pd-related-save" type="button" aria-label={`${isSaved ? "Remove" : "Save"} ${item.name} ${isSaved ? "from" : "to"} wishlist`} aria-pressed={isSaved} onClick={() => setRelatedSaved(current => isSaved ? current.filter(id => id !== item.id) : [...current, item.id])}><Icon name="heart" /></button>
                    <span className="pd-related-rating">★ {item.rating}</span>
                  </div>
                  <h3><Link href={`/productDetails?id=${encodeURIComponent(item.id)}`}>{item.name}</Link></h3>
                  <p className="pd-related-description" title={description}>{description}</p>
                  <div className="pd-related-price"><strong>{money.format(price)}</strong><del>{money.format(originalPrice)}</del></div>
                  <label className="pd-related-variant">
                    <span className="sr-only">Pack size for {item.name}</span>
                    <select value={variantIndex} onChange={event => setRelatedVariantIndexes(current => ({ ...current, [item.id]: Number(event.target.value) }))}>
                      {itemVariants.map((option, index) => <option key={`${item.id}-${option.label}`} value={index}>{option.label}</option>)}
                    </select>
                  </label>
                  <button className="pd-related-add" type="button" onClick={() => setSelectedRelated(item)}><Icon name="cart" />Add to Cart</button>
                </article></SwiperSlide>;
              })}
            </Swiper> : <p className="pd-related-empty">More products in this category are coming soon.</p>}
          </section>
        </div>
      </div>
    </div>
    {selectedRelated && <AddToCart key={selectedRelated.id} product={selectedRelated} locale={productCards.locale} currency={productCards.currency} saved={relatedSaved.includes(selectedRelated.id)} onToggleWishlist={() => setRelatedSaved(current => current.includes(selectedRelated.id) ? current.filter(id => id !== selectedRelated.id) : [...current, selectedRelated.id])} onClose={closeRelatedDetails} onOpenProduct={setSelectedRelated} />}
  </main>;
}
