"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "@/components/navbar/Navbar";
import AddToCart from "@/components/modals/AddToCart/AddToCart";
import Variant from "@/components/modals/variant/Variant";
import type { CartItem } from "@/components/modals/cart/Cart";
import { loadCatalogPageAction } from "@/app/actions";
import { fallbackImage, isRemoteImage, shortName, type ApiFacetCategory, type Product } from "@/lib/api";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "@/lib/wishlist";
import { ProductCardsSkeleton } from "@/components/skeleton/Skeletons";
import "./ProductsList.css";
import VariantChips from "@/components/products/VariantChips";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

function CartIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 8H5" /><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /></svg>;
}

export interface CatalogQueryProps { category?: string; sub?: string; q?: string; sort?: string; maxPrice?: string }

/** The products page for the visitor's city. Filters and sort live in the address bar (the server renders the first 20); more load as you scroll. */
export default function ProductsCatalog({ initial, total, categories, query, cityName }: { initial: Product[]; total: number; categories: ApiFacetCategory[]; query: CatalogQueryProps; cityName: string }) {
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
      if (stored === "en" || stored === "bn" || stored === "hi") {
        setCurrentLang(stored);
      }
    } catch {
      // Use fallback
    }

    const handleLanguageChange = (event: Event) => {
      const newLang = (event as CustomEvent<SupportedLang>).detail;
      if (newLang === "en" || newLang === "bn" || newLang === "hi") {
        setCurrentLang(newLang);
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const t = textMap[currentLang] || englishText;

  const money = useMemo(() => {
    return new Intl.NumberFormat(t.locale, {
      style: "currency",
      currency: t.currency,
      maximumFractionDigits: 0,
    });
  }, [t.locale, t.currency]);

  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initial.length < total);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  useEffect(() => {
    if (!isFilterOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFilterOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isFilterOpen]);

  const sortBy = query.sort ?? "";
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const activeCategory = categories.find(c => c.slug === query.category);
  const activeSub = activeCategory?.subCategories.find(s => s.slug === query.sub);

  const sortOptionsBase = useMemo(() => [
    { value: "", label: t.sortName },
    { value: "name", label: t.sortName },
    { value: "price_asc", label: t.sortPriceAsc },
    { value: "price_desc", label: t.sortPriceDesc },
    { value: "discount", label: t.sortDiscount },
  ], [t]);

  const priceOptions = useMemo(() => [
    { value: "", label: t.filterAnyPrice },
    ...[100, 250, 500, 1000, 2500].map(v => ({
      value: String(v),
      label: t.filterUnderPrice.replace("{price}", money.format(v)),
    })),
  ], [t, money]);

  // with a search the default order is the best match first
  const sortOptions = useMemo(() => {
    if (query.q) {
      return [{ value: "", label: t.sortBestMatch }, ...sortOptionsBase.filter(o => o.value !== "")];
    }
    return sortOptionsBase.filter(o => o.value !== "name");
  }, [query.q, sortOptionsBase, t.sortBestMatch]);

  const go = (next: CatalogQueryProps) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    startNavigation(() => router.push(params.size ? `/products?${params}` : "/products", { scroll: false }));
  };
  const reset = () => go({ q: query.q });

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

  const loadMore = async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    setLoadError("");
    const res = await loadCatalogPageAction(query, page + 1).catch(() => null);
    if (!res || "error" in res) setLoadError(res && "error" in res ? res.error : t.loadMoreError);
    else {
      setItems(current => {
        const seen = new Set(current.map(p => p.id));
        return [...current, ...res.products.filter(p => !seen.has(p.id))];
      });
      setPage(p => p + 1);
      setHasMore(res.hasMore);
    }
    busy.current = false;
    setLoading(false);
  };
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; });
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loadError) return;
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) void loadMoreRef.current(); }, { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadError, page]);

  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantIndexes, setVariantIndexes] = useState<Record<string, number>>({});
  useEffect(() => {
    const refreshWishlist = () => setSaved(readWishlistIds());
    refreshWishlist();
    return subscribeToWishlist(refreshWishlist);
  }, []);

  const renderProduct = (product: Product) => {
    const isSaved = saved.includes(product.id);
    const variants = product.variants?.length ? product.variants : [{ label: product.weight, amount: 1, unit: "pack", price: product.price, originalPrice: product.originalPrice }];
    const initialVariant = Math.max(0, variants.findIndex(variant => variant.price === product.price));
    const selectedIndex = variantIndexes[product.id] ?? initialVariant;
    const variant = variants[selectedIndex] ?? variants[0];
    const discount = variant.originalPrice > 0 ? Math.max(0, Math.round((1 - variant.price / variant.originalPrice) * 100)) : 0;
    const description = t.productDescription.replace("{name}", product.name);
    return (
      <article className="product-card" key={product.id}>
        <div className="product-image">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 1023px) 25vw, 180px" draggable={false} unoptimized={isRemoteImage(product.image)} onError={fallbackImage} />
          <span className="product-discount-badge">{t.discount.replace("{percent}", String(discount))}</span>
          {product.rating > 0 && <span className="product-image-rating" aria-label={t.rating.replace("{rating}", String(product.rating)).replace("{reviews}", String(product.reviews))}>★ {product.rating}</span>}
          <button type="button" className="product-save" aria-pressed={isSaved} aria-label={(isSaved ? t.unsave : t.save).replace("{name}", product.name)} onClick={() => setSaved(toggleWishlistId(product.id))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          </button>
        </div>
        <h3><Link href={`/${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
        <p className="product-description" title={description}>{description}</p>
        <div className="product-pricing"><strong>{money.format(variant.price)}</strong><del>{money.format(variant.originalPrice)}</del></div>
        <VariantChips name={product.name} variants={variants} selected={selectedIndex} onSelect={index => setVariantIndexes(current => ({ ...current, [product.id]: index }))} onMore={() => setVariantProduct(product)} />
        <div className="product-card-actions">
          <button className="product-details-button" type="button" onClick={() => setVariantProduct(product)}><CartIcon />{t.addToCart}</button>
          <button className="product-quick-view" type="button" aria-label={t.quickViewAria.replace("{name}", product.name)} onClick={() => setSelected(product)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </article>
    );
  };

  const heading = query.q
    ? t.searchResultsTitle.replace("{query}", query.q)
    : activeSub
    ? shortName(activeSub.name)
    : activeCategory
    ? shortName(activeCategory.name)
    : t.allProducts;

  const productsCountText = t.productsCount
    .replace("{count}", items.length.toLocaleString(t.locale))
    .replace("{total}", total.toLocaleString(t.locale))
    .replace("{city}", cityName);

  return (
    <main className={`products-section catalog-page${navigating ? " is-loading" : ""}`} aria-busy={navigating} lang={t.language}>
      {isFilterOpen && <button className="catalog-filter-backdrop" type="button" aria-label={t.filterCloseAria} onClick={() => setIsFilterOpen(false)} />}
      <aside className={`catalog-filters${isFilterOpen ? " is-open" : ""}`} aria-label={t.filterAria}>
        <div className="catalog-filter-title"><h2>{t.filterTitle}</h2><button type="button" onClick={reset}>{t.filterReset}</button><button className="catalog-filter-close" type="button" aria-label={t.filterCloseAria} onClick={() => setIsFilterOpen(false)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg></button></div>
        <details open><summary>{t.filterCategory}</summary><div className="catalog-filter-options">
          <label><input type="radio" name="category" checked={!query.category} onChange={() => go({ q: query.q, sort: query.sort, maxPrice: query.maxPrice })} />{t.filterAllCategories}</label>
          {categories.map(option => <label key={option.id}><input type="radio" name="category" checked={query.category === option.slug} onChange={() => go({ ...query, category: option.slug, sub: undefined })} />{shortName(option.name)}</label>)}
        </div></details>
        <details open><summary>{t.filterSubcategory}</summary><div className="catalog-filter-options">
          {activeCategory ? <>
            <label><input type="radio" name="subcategory" checked={!query.sub} onChange={() => go({ ...query, sub: undefined })} />{t.filterAllInSubcategory.replace("{category}", shortName(activeCategory.name))}</label>
            {activeCategory.subCategories.map(option => <label key={option.id}><input type="radio" name="subcategory" checked={query.sub === option.slug} onChange={() => go({ ...query, sub: option.slug })} />{shortName(option.name)}</label>)}
          </> : <p className="catalog-filter-hint">{t.filterChooseCategoryFirst}</p>}
        </div></details>
        <details open><summary>{t.filterPrice}</summary><div className="catalog-filter-options">
          {priceOptions.map(option => <label key={option.value}><input type="radio" name="price" checked={(query.maxPrice ?? "") === option.value} onChange={() => go({ ...query, maxPrice: option.value || undefined })} />{option.label}</label>)}
        </div></details>
      </aside>
      <section className="catalog-results" aria-labelledby="catalog-heading">
        <header className="catalog-toolbar">
          <div><h1 id="catalog-heading">{heading}</h1><p role="status">{productsCountText}</p></div>
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
                <span>{t.sortLabel} <strong>{sortOptions.find(option => option.value === sortBy)?.label}</strong></span>
                <svg className="catalog-sort-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
              </button>
              <div
                id="catalog-sort-options"
                className="catalog-sort-menu"
                role="listbox"
                aria-label={t.sortAria}
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
                        go({ ...query, sort: option.value || undefined });
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
            <button className="catalog-filter-trigger" type="button" aria-expanded={isFilterOpen} onClick={() => setIsFilterOpen(open => !open)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M7 12h10m-7 6h4" /></svg>
              <span>{t.filterTrigger}</span>
            </button>
            <div className="catalog-view-toggle" role="group" aria-label={t.viewGroupAria}><button type="button" aria-label={t.viewGridAria} aria-pressed={view === 'grid'} onClick={() => setView('grid')}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button><button type="button" aria-label={t.viewListAria} aria-pressed={view === 'list'} onClick={() => setView('list')}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 5h12M9 12h12M9 19h12M3 5h2M3 12h2M3 19h2"/></svg></button></div>
          </div>
        </header>
        {navigating ? <div className={'catalog-cards catalog-cards--' + view} role="status" aria-label={t.loadingProducts}><ProductCardsSkeleton count={8} /></div> : items.length ? <div className={'catalog-cards catalog-cards--' + view}>{items.map(renderProduct)}{loading && <ProductCardsSkeleton count={4} />}</div> : <div className="catalog-empty"><h2>{t.emptyTitle}</h2><p>{t.emptySubtitle}</p><button type="button" onClick={reset}>{t.clearFilters}</button></div>}
        {hasMore && !loadError && <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />}
        {loadError && <p className="catalog-more-status" role="alert">{loadError} <button type="button" onClick={() => { setLoadError(""); void loadMore(); }}>{t.tryAgain}</button></p>}
        {!hasMore && items.length > 0 && <p className="catalog-more-status">{t.seenAllProducts.replace("{total}", total.toLocaleString(t.locale))}</p>}
      </section>
      {selected && <AddToCart key={selected.id} product={selected} locale={t.locale} currency={t.currency} saved={saved.includes(selected.id)} onToggleWishlist={() => setSaved(toggleWishlistId(selected.id))} onClose={() => setSelected(null)} onOpenProduct={setSelected} />}
      {variantProduct && <Variant product={variantProduct} currency={t.currency} onClose={() => setVariantProduct(null)} onGoToCart={(item: CartItem) => {
        window.dispatchEvent(new CustomEvent("tazahat:add-cart-item", { detail: item }));
        setVariantProduct(null);
      }} />}
    </main>
  );
}
