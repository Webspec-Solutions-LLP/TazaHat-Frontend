"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import text from "@/components/products/english.json";
import "@/components/products/Products.css";
import "./ProductsList.css";

type Product = (typeof text.products)[number];
const money = new Intl.NumberFormat(text.locale, { style: "currency", currency: text.currency, maximumFractionDigits: 0 });

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="products-section catalog-page" aria-busy="true" />}><ProductsContent /></Suspense>;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const lockedCategory = searchParams.get("category");
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState("featured");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<string[]>(() => lockedCategory ? [lockedCategory] : []);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const ceiling = Math.max(...text.products.map(p => p.price));
  const [price, setPrice] = useState(ceiling);
  const categoryOptions = [...new Set([...text.products.map(p => p.category), ...(lockedCategory ? [lockedCategory] : [])])];
  const subcategoryOptions = [...new Set(text.products.filter(p => !categories.length || categories.includes(p.category)).map(p => p.subcategory))];
  const filtered = text.products.filter(p => (!categories.length || categories.includes(p.category)) && (!subcategories.length || subcategories.includes(p.subcategory)) && p.rating >= rating && p.price <= price);
  useEffect(() => { setCategories(lockedCategory ? [lockedCategory] : []); setSubcategories([]); }, [lockedCategory]);
  useEffect(() => {
    if (!isSortOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setIsSortOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSortOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSortOpen]);
  const reset = () => { setCategories(lockedCategory ? [lockedCategory] : []); setSubcategories([]); setRating(0); setPrice(ceiling); };
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
    { value: "name", label: "Name: A to Z" },
  ];
  const sortedProducts = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      case "name": return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const renderProduct = (product: Product) => {
    const isSaved = saved.includes(product.id);
    const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
    const initialVariant = Math.max(0, variants.findIndex(variant => variant.price === product.price));
    const selectedIndex = variantIndexes[product.id] ?? initialVariant;
    const variant = variants[selectedIndex] ?? variants[0];
    const discount = variant.originalPrice > 0 ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100)) : 0;
    const description = `${product.name} selected for freshness and quality, ready for your everyday meals.`;
    return (
      <article className="product-card" key={product.id}>
        <div className="product-image">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 1023px) 25vw, 180px" draggable={false} />
          <span className="product-discount-badge">{text.discount.replace("{percent}", String(discount))}</span>
          <span className="product-image-rating" aria-label={text.rating.replace("{rating}", String(product.rating)).replace("{reviews}", String(product.reviews))}>★ {product.rating}</span>
          <button type="button" className="product-save" aria-pressed={isSaved} aria-label={(isSaved ? text.unsave : text.save).replace("{name}", product.name)} onClick={() => setSaved(current => isSaved ? current.filter(id => id !== product.id) : [...current, product.id])}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          </button>
        </div>
        <h3>{product.name}</h3>
        <p className="product-description" title={description}>{description}</p>
        <div className="product-pricing"><strong>{money.format(variant.price)}</strong><del>{money.format(variant.originalPrice)}</del></div>
        <p className="product-rating" aria-label={text.rating.replace("{rating}", String(product.rating)).replace("{reviews}", String(product.reviews))}><span aria-hidden="true">★ {product.rating} <span>({product.reviews})</span></span></p>
        <div className="product-variant-wrap">
          <button type="button" className="product-variant-trigger" aria-haspopup="listbox" aria-expanded={openVariant === product.id} onClick={() => setOpenVariant(current => current === product.id ? null : product.id)}>
            <span>{variant.label}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
          </button>
          {openVariant === product.id && <div className="product-variant-menu" role="listbox" aria-label={`Choose size for ${product.name}`}>
            {variants.map((option, index) => <button type="button" role="option" aria-selected={index === selectedIndex} key={`${product.id}-${option.label}`} onClick={() => { setVariantIndexes(current => ({ ...current, [product.id]: index })); setOpenVariant(null); }}><span>{option.label}</span><span>{money.format(option.price)}</span></button>)}
          </div>}
        </div>
        <button className="product-details-button" type="button" onClick={() => { setSelected(product); dialog.current?.showModal(); }}><CartIcon />Add to Cart</button>
      </article>
    );
  };

  return (
    <main className="products-section catalog-page">
      <aside className="catalog-filters" aria-label="Product filters">
        <div className="catalog-filter-title"><h2>Filter By</h2><button type="button" onClick={reset}>Reset</button></div>
        <details open><summary>Filter by Category</summary><div className="catalog-filter-options">{categoryOptions.map(option => <label key={option}><input type="checkbox" checked={categories.includes(option)} disabled={Boolean(lockedCategory)} onChange={() => { setCategories(current => current.includes(option) ? current.filter(x => x !== option) : [...current, option]); setSubcategories([]); }} />{option}<span>{text.products.filter(p => p.category === option).length}</span></label>)}</div></details>
        <details open><summary>Filter by Subcategory</summary><div className="catalog-filter-options">{subcategoryOptions.map(option => <label key={option}><input type="checkbox" checked={subcategories.includes(option)} onChange={() => setSubcategories(current => current.includes(option) ? current.filter(x => x !== option) : [...current, option])} />{option}</label>)}</div></details>
        <details open><summary>Filter by Rating</summary><div className="catalog-filter-options">{[0, 4, 4.5, 4.7].map(value => <label key={value}><input type="radio" name="rating" checked={rating === value} onChange={() => setRating(value)} />{value === 0 ? 'All ratings' : '? ' + value + ' & above'}</label>)}</div></details>
        <details open><summary>Filter by Price</summary><div className="catalog-price"><label htmlFor="catalog-price">Maximum price <strong>{money.format(price)}</strong></label><input id="catalog-price" type="range" min="0" max={ceiling} value={price} onChange={event => setPrice(Number(event.target.value))} /><div><span>{money.format(0)}</span><span>{money.format(ceiling)}</span></div></div></details>
      </aside>
      <section className="catalog-results" aria-labelledby="catalog-heading">
        <header className="catalog-toolbar">
          <div><h1 id="catalog-heading">All Products</h1><p role="status">{filtered.length} of {text.products.length} products</p></div>
          <div className="catalog-toolbar-actions">
            <div className={`catalog-sort${isSortOpen ? " is-open" : ""}`} ref={sortRef}>
              <button
                type="button"
                className="catalog-sort-trigger"
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                aria-controls="catalog-sort-options"
                onClick={() => setIsSortOpen(open => !open)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M7 12h10m-7 6h4" /></svg>
                <span>Sort: <strong>{sortOptions.find(option => option.value === sortBy)?.label}</strong></span>
                <svg className="catalog-sort-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
              </button>
              <div
                id="catalog-sort-options"
                className="catalog-sort-menu"
                role="listbox"
                aria-label="Sort products"
                aria-hidden={!isSortOpen}
              >
                <div className="catalog-sort-menu-inner">
                  {sortOptions.map(option => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={sortBy === option.value}
                      tabIndex={isSortOpen ? 0 : -1}
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                    >
                      {option.label}
                      {sortBy === option.value && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="catalog-view-toggle" role="group" aria-label="Product display"><button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button><button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 5h12M9 12h12M9 19h12M3 5h2M3 12h2M3 19h2"/></svg></button></div>
          </div>
        </header>
        {sortedProducts.length ? <div className={'catalog-cards catalog-cards--' + view}>{sortedProducts.map(renderProduct)}</div> : <div className="catalog-empty"><h2>No products found</h2><p>Try changing your filters to see more fresh picks.</p><button type="button" onClick={reset}>Clear filters</button></div>}
      </section>
      <dialog ref={dialog} className="product-dialog" aria-labelledby="product-dialog-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <button className="product-dialog-close" type="button" onClick={() => dialog.current?.close()}>{text.close} ×</button>
        {selected && <><Image src={selected.image} alt={selected.name} width={240} height={200} className="product-dialog-image" /><h2 id="product-dialog-title">{selected.name}</h2><p>{selected.weight}</p><strong>{money.format(selected.price)}</strong><p className="product-demo-note">{text.demoNote}</p></>}
      </dialog>
    </main>
  );
}
