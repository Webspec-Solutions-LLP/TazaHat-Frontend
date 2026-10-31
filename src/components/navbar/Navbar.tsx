"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Cart, { type CartItem } from "../modals/cart/Cart";
import CompareList, {
  COMPARE_CHANGE_EVENT,
  COMPARE_STORAGE_KEY,
  type CompareProduct,
} from "../modals/compareList/CompareList";
import CompareDetails from "../modals/compareDetails/CompareDetails";
import AddToCart from "../modals/AddToCart/AddToCart";
import Location from "../modals/location/Location";
import Login from "../modals/login/Login";
import { searchSuggestionsAction } from "@/app/actions";
import { SearchHistorySkeleton, SearchSuggestionSkeleton } from "../skeleton/Skeletons";
import { fallbackImage, isRemoteImage, type Product as CatalogProduct } from "@/lib/api";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "../../lib/wishlist";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./Navbar.css";

const SEARCH_HISTORY_KEY = "tazahat-search-history";
const MAX_SEARCH_HISTORY = 8;
export const LANGUAGE_STORAGE_KEY = "tazahat-language";
export const LANGUAGE_CHANGE_EVENT = "tazahat:change-language";

export type SupportedLang = "en" | "bn" | "hi";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};
import { OPEN_LOCATION_EVENT, useCity } from "../../lib/city";
import "./Navbar.css";

const SEARCH_HISTORY_KEY = "tazahat-search-history";
const MAX_SEARCH_HISTORY = 30;
const MIN_HISTORY_LENGTH = 4; // shorter searches are not remembered
const HISTORY_PAGE_SIZE = 5;

interface NavbarProps {
  cartCount?: number;
  onSearch?: (query: string) => void;
  lang?: SupportedLang;
  onLanguageChange?: (lang: SupportedLang) => void;
}

export default function Navbar({
  cartCount = 0,
  onSearch,
  lang,
  onLanguageChange,
}: NavbarProps) {
  const [currentLang, setCurrentLang] = useState<SupportedLang>(() => {
    if (lang) return lang;
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
        if (stored && (stored === "en" || stored === "bn" || stored === "hi")) {
          return stored;
        }
      } catch {
        // Fallback to default English
      }
    }
    return "en";
  });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [isCompactSearchOpen, setIsCompactSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // the history list shows 5 at a time; "More" swaps in the next 5 after a short skeleton
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyTimer = useRef<number | undefined>(undefined);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [hasCustomCart, setHasCustomCart] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCompareDetailsOpen, setIsCompareDetailsOpen] = useState(false);
  const [compareDetailsProducts, setCompareDetailsProducts] = useState<CompareProduct[]>([]);
  const [compareCount, setCompareCount] = useState(0);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { city, ready: cityReady } = useCity();
  const deliveryLocation = city ? city.name : "Select your city";
  const askedForCity = useRef(false);
  // first visit: ask for the delivery city; other parts of the page can ask again with the "open location" event
  useEffect(() => {
    if (cityReady && !city && !askedForCity.current) {
      askedForCity.current = true;
      setIsLocationOpen(true);
    }
  }, [cityReady, city]);
  useEffect(() => {
    const open = () => setIsLocationOpen(true);
    window.addEventListener(OPEN_LOCATION_EVENT, open);
    return () => window.removeEventListener(OPEN_LOCATION_EVENT, open);
  }, []);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lang) {
      setCurrentLang(lang);
    }
  }, [lang]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const newLang = (event as CustomEvent<SupportedLang>).detail;
      if (newLang && (newLang === "en" || newLang === "bn" || newLang === "hi")) {
        setCurrentLang(newLang);
      }
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const changeLanguage = (newLang: SupportedLang) => {
    setCurrentLang(newLang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: newLang }));
    } catch {
      // Ignore if localStorage unavailable
    }
    onLanguageChange?.(newLang);
  };

  const t = textMap[currentLang] || englishText;

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory: unknown = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory.filter((item): item is string => typeof item === "string" && item.length >= MIN_HISTORY_LENGTH).slice(0, MAX_SEARCH_HISTORY));
        }
      }
    } catch {
      // Ignore unavailable storage or malformed history and keep search usable.
    }
  }, []);
  useEffect(() => {
    const refreshWishlist = () => setSavedProducts(readWishlistIds());
    refreshWishlist();
    return subscribeToWishlist(refreshWishlist);
  }, []);
  useEffect(() => {
    const refreshCompareCount = () => {
      try {
        const stored = window.localStorage.getItem(COMPARE_STORAGE_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setCompareCount(list.length);
            return;
          }
        }
        setCompareCount(0);
      } catch {
        setCompareCount(0);
      }
    };

    refreshCompareCount();

    window.addEventListener(COMPARE_CHANGE_EVENT, refreshCompareCount);
    window.addEventListener("storage", refreshCompareCount);
    return () => {
      window.removeEventListener(COMPARE_CHANGE_EVENT, refreshCompareCount);
      window.removeEventListener("storage", refreshCompareCount);
    };
  }, []);
  const handleCartItemsChange = useCallback((items: CartItem[]) => {
    setHasCustomCart(true);
    setCartItems(items);
  }, []);
  // Search suggestions come from the server (for the delivery city), a moment after the visitor stops typing.
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  useEffect(() => {
    const text = searchQuery.trim();
    if (text.length < 2) { const reset = window.setTimeout(() => { setSearchResults([]); setSearchedFor(""); }, 0); return () => window.clearTimeout(reset); }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchSuggestionsAction(text)
        .then((found) => { if (!cancelled) { setSearchResults(found); setSearchedFor(text); } })
        .catch(() => { if (!cancelled) { setSearchResults([]); setSearchedFor(text); } });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [searchQuery]);
  // the answer on screen is for what is typed now (not an older, shorter word)
  const isSearching = searchQuery.trim().length >= 2 && searchedFor !== searchQuery.trim();
  // on the results page the box shows what was searched
  const urlQuery = pathname === "/products" ? searchParams.get("q") ?? "" : "";
  const [shownUrlQuery, setShownUrlQuery] = useState("");
  if (urlQuery !== shownUrlQuery) {
    setShownUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }
  // click outside the search box closes the suggestions
  useEffect(() => {
    if (!isSearchResultsOpen) return;
    const close = (event: PointerEvent) => { if (!searchFormRef.current?.contains(event.target as Node)) setIsSearchResultsOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isSearchResultsOpen]);
  const visibleCartCount = hasCustomCart
    ? cartItems.reduce((count, item) => count + item.quantity, 0)
    : cartCount;

  useEffect(() => {
    if (!isAccountOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountOpen]);

  const rememberSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;
    if (query.length < MIN_HISTORY_LENGTH) return query;
    const nextHistory = [query, ...searchHistory.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, MAX_SEARCH_HISTORY);
    setSearchHistory(nextHistory);
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // Search still works when storage is disabled or full.
    }
    return query;
  };

  /** open the results page (/products?q=...) for a search */
  const goSearch = (text: string) => {
    const query = rememberSearch(text);
    if (!query) return;
    setSearchQuery(query);
    setIsSearchResultsOpen(false);
    setIsCompactSearchOpen(false);
    searchInputRef.current?.blur();
    onSearch?.(query);
    router.push(`/products?q=${encodeURIComponent(query)}`);
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(searchQuery);
  };

  const historyPageCount = Math.max(1, Math.ceil(searchHistory.length / HISTORY_PAGE_SIZE));
  const showNextHistory = () => {
    window.clearTimeout(historyTimer.current);
    setHistoryLoading(true);
    historyTimer.current = window.setTimeout(() => {
      setHistoryPage((page) => (page + 1 < historyPageCount ? page + 1 : 0));
      setHistoryLoading(false);
    }, 350);
  };
  useEffect(() => () => window.clearTimeout(historyTimer.current), []);

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setHistoryPage(0);
    try {
      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // Keep the in-memory history cleared even when storage is unavailable.
    }
  };

  const addCartItem = useCallback((newItem: CartItem) => {
    setHasCustomCart(true);
    setCartItems((items) => {
      const existingItem = items.find((item) => item.id === newItem.id);
      if (existingItem) {
        return items.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...items, newItem];
    });
  }, []);

  useEffect(() => {
    const handleSectionAddToCart = (event: Event) => {
      const item = (event as CustomEvent<CartItem>).detail;
      if (!item?.id) return;
      addCartItem(item);
      setIsCartOpen(true);
    };
    const handleOpenCart = () => setIsCartOpen(true);

    window.addEventListener("tazahat:add-cart-item", handleSectionAddToCart);
    window.addEventListener("tazahat:open-cart", handleOpenCart);
    return () => {
      window.removeEventListener("tazahat:add-cart-item", handleSectionAddToCart);
      window.removeEventListener("tazahat:open-cart", handleOpenCart);
    };
  }, [addCartItem]);

  const handleAddToCart = (product: CatalogProduct) => {
    addCartItem({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: product.weight,
      quantity: 1,
    });
  };

  const updateCartQuantity = useCallback((itemId: string, delta: number) => {
    setHasCustomCart(true);
    setCartItems((items) =>
      items
        .map((item) => {
          if (item.id !== itemId) return item;
          const quantity = item.quantity + delta;
          return quantity > 0 ? { ...item, quantity } : null;
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const getProductCartItems = (productId: string) =>
    cartItems.filter(
      (item) => item.id === productId || item.id.startsWith(`${productId}-`)
    );

  // Other parts of the page (the product page's quantity stepper) see the cart through these events and can change a quantity.
  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
    window.dispatchEvent(new CustomEvent("tazahat:cart-changed", { detail: cartItems }));
  }, [cartItems]);
  useEffect(() => {
    const answer = () => window.dispatchEvent(new CustomEvent("tazahat:cart-changed", { detail: cartItemsRef.current }));
    const change = (event: Event) => {
      const { id, delta } = (event as CustomEvent<{ id: string; delta: number }>).detail ?? {};
      if (typeof id === "string" && typeof delta === "number") updateCartQuantity(id, delta);
    };
    window.addEventListener("tazahat:cart-request", answer);
    window.addEventListener("tazahat:update-cart-quantity", change);
    return () => {
      window.removeEventListener("tazahat:cart-request", answer);
      window.removeEventListener("tazahat:update-cart-quantity", change);
    };
  }, [updateCartQuantity]);

  const closeProductDetails = useCallback(() => setSelectedProduct(null), []);

  return (
    <header
      className={`tazahat-navbar${isCompactSearchOpen ? " is-compact-search-open" : ""}`}
      style={{ backgroundColor: "#00366b", color: "#ffffff" }}
    >
      <div className="tazahat-navbar-container">
        {/* Left: Brand and delivery location */}
        <div className="navbar-brand">
          <div className="navbar-brand-stack">
            <Link href="/" className="navbar-logo-link" aria-label="TazaHaat Home">
              <Image
                src="/images/logo.webp"
                alt="TazaHaat Logo"
                width={38}
                height={38}
                sizes="38px"
                priority
                className="navbar-logo-img"
              />
            </Link>
            <div className="navbar-brand-details">
              <Link href="/" className="navbar-brand-name-link" aria-label="TazaHaat Home">
                <span className="navbar-brand-name">{t.brandName}<span>{t.brandNameHighlight}</span></span>
              </Link>
              <button type="button" className="navbar-location" aria-label={t.deliverTo} onClick={() => setIsLocationOpen(true)}>
                <span className="navbar-location-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span className="navbar-location-text">
                  <span className="navbar-location-label">{t.deliverTo}</span>
                  <span className="navbar-location-val-wrap">
                    <span className="navbar-location-city">{deliveryLocation || t.defaultDeliveryLocation}</span>
                    <svg className="navbar-location-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        {isCompactSearchOpen && <button type="button" className="navbar-search-backdrop" aria-label={t.searchCloseAria} onClick={() => setIsCompactSearchOpen(false)} />}
        <form className={`navbar-search-form${isCompactSearchOpen ? " is-compact-open" : ""}`} onSubmit={handleSearchSubmit} role="search">
        <button
          type="button"
          className="navbar-compact-search-toggle"
          aria-label="Open search"
          aria-expanded={isCompactSearchOpen}
          onClick={() => {
            setIsCompactSearchOpen(true);
            window.requestAnimationFrame(() => searchInputRef.current?.focus());
          }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 4 4"/></svg>
        </button>
        {isCompactSearchOpen && <button type="button" className="navbar-search-backdrop" aria-label="Close search" onClick={() => setIsCompactSearchOpen(false)} />}
        <form ref={searchFormRef} className={`navbar-search-form${isCompactSearchOpen ? " is-compact-open" : ""}`} onSubmit={handleSearchSubmit} role="search">
          <div className="navbar-search-box">
            <span className="navbar-search-overlay-icon" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 4 4"/></svg></span>
            <input
              ref={searchInputRef}
              type="text"
              className="navbar-search-input"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onFocus={() => { setIsSearchResultsOpen(true); setHistoryPage(0); }}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query);
                setIsSearchResultsOpen(Boolean(query.trim()));
              }}
              aria-label={t.searchInputAria}
              onKeyDown={(e) => { if (e.key === "Escape") { setIsSearchResultsOpen(false); searchInputRef.current?.blur(); } }}
              autoComplete="off"
              aria-label="Search products"
              aria-controls="navbar-search-results"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                className="navbar-search-btn"
                aria-label={t.searchClearAria}
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchResultsOpen(false);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : (
              <button type="submit" className="navbar-search-btn" aria-label={t.searchSubmitAria}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}
            <button type="button" className="navbar-search-overlay-close" aria-label={t.searchCloseAria} onClick={() => setIsCompactSearchOpen(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </div>
          {isSearchResultsOpen && (searchQuery.trim() || searchHistory.length > 0) && (
            <div className="navbar-search-results" id="navbar-search-results" role="list" aria-label={t.searchResultsAria}>
              {!searchQuery.trim() ? (
                <>
                  <div className="navbar-search-history-heading">
                    <span>{t.searchRecent}</span>
                    <button type="button" onClick={clearSearchHistory}>{t.searchClearHistory}</button>
                  </div>
                  {historyLoading ? <SearchHistorySkeleton rows={HISTORY_PAGE_SIZE} /> : searchHistory.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE).map((query) => (
                    <button
                      className="navbar-search-history-item"
                      key={query}
                      type="button"
                      onClick={() => goSearch(query)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      <span>{query}</span>
                    </button>
                  ))}
                  {historyPageCount > 1 && !historyLoading && (
                    <button type="button" className="navbar-search-history-more" onClick={showNextHistory}>
                      {historyPage + 1 < historyPageCount ? "More" : "Back to latest"}
                    </button>
                  )}
                </>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => {
                  const productCartItems = getProductCartItems(product.id);
                  const productQuantity = productCartItems.reduce(
                    (total, item) => total + item.quantity,
                    0
                  );
                  return (
                    <div className="navbar-search-result" key={product.id} role="listitem">
                      <Link href={`/${encodeURIComponent(product.id)}`} className="navbar-search-result-link" onClick={() => setIsSearchResultsOpen(false)}>
                      <Image
                        className="navbar-search-result-image"
                        src={product.image}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized={isRemoteImage(product.image)}
                        onError={fallbackImage}
                      />
                      <span className="navbar-search-result-info">
                        <span className="navbar-search-result-name">{product.name}</span>
                        <span className="navbar-search-result-meta">{product.weight} · Rs {product.price}</span>
                      </span>
                      </Link>
                      {productQuantity > 0 ? (
                        <div className="navbar-search-quantity" role="group" aria-label={`Quantity of ${product.name} in cart`}>
                          <button
                            type="button"
                            aria-label={`Remove one ${product.name} from cart`}
                            onClick={() => updateCartQuantity(productCartItems[0].id, -1)}
                          >
                            −
                          </button>
                          <output aria-live="polite" aria-label={`${productQuantity} in cart`}>{productQuantity}</output>
                          <button
                            type="button"
                            aria-label={`Add one ${product.name} to cart`}
                            onClick={() => updateCartQuantity(productCartItems[0].id, 1)}
                            disabled={productCartItems[0].quantity >= 99}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="navbar-search-add-btn"
                          type="button"
                          onClick={() => {
                            setIsSearchResultsOpen(false);
                            if (product.variants?.length) {
                              setSelectedProduct(product);
                            } else {
                              handleAddToCart(product);
                            }
                          }}
                          aria-label={`Add ${product.name} to cart`}
                        >
                          {t.searchAddBtn}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : isSearching ? (
                <SearchSuggestionSkeleton />
              ) : (
                <p className="navbar-search-empty">{t.searchNoResults}</p>
                <p className="navbar-search-empty">No products found for “{searchQuery.trim()}” in your city.</p>
              )}
              {searchQuery.trim() && searchResults.length > 0 && (
                <button type="button" className="navbar-search-see-all" onClick={() => goSearch(searchQuery)}>See all results for “{searchQuery.trim()}” <span aria-hidden="true">→</span></button>
              )}
            </div>
          )}
        </form>

        {/* Right Navigation Actions */}
        <nav className="navbar-actions" aria-label="User navigation">
          {/* Compact Search Toggle (visible on screens <= 876px) */}
          <Link href="/deliveryService" className="navbar-compact-delivery" aria-label="Delivery Service">
            <svg viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5.5h14v12H2z"/><path d="M16 10h5l4 4.25v3.25h-9z"/><path d="M21 10v4.5h4"/><circle cx="6.5" cy="19" r="2.25"/><circle cx="21" cy="19" r="2.25"/><path d="M3 8h5"/></svg>
            <span>Delivery</span>
          </Link>
          <Link
            href="/deliveryService"
            className="navbar-delivery-service"
            aria-label="Delivery Service"
          >
            <span className="navbar-delivery-icon-wrap">
              <svg
                viewBox="0 0 32 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 5h17v13H2z" />
                <path d="M19 9h5l5 5v4H19z" />
                <circle cx="8" cy="19" r="2.5" />
                <circle cx="24" cy="19" r="2.5" />
                <path d="M5 9h8M5 13h6M22 11h2l3 3h-5z" />
              </svg>
            </span>
            <span className="navbar-delivery-copy">
              <span className="navbar-delivery-label">Delivery Service</span>
              <span className="navbar-delivery-caption">Book a pickup</span>
            </span>
            <span className="navbar-delivery-badge">New</span>
          </Link>

          {/* Account */}
          <div className="navbar-account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="navbar-action-item"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              onClick={() => setIsAccountOpen(open => !open)}
            >
              <div className="navbar-action-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="navbar-action-label">Account</span>
            </button>
            <div className={`navbar-account-dropdown${isAccountOpen ? " is-open" : ""}`} role="menu" aria-label="Account options" aria-hidden={!isAccountOpen}>
              <button type="button" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => { setIsAccountOpen(false); setIsLoginOpen(true); }}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/><path d="M10 16l4-4-4-4M14 12H3"/></svg></span>Login
              </button>
              <Link href="/wishlist" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></span>Wishlist
              </Link>
              <Link href="/myOrders" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12l2 3v15H4V6l2-3Z"/><path d="M4 6h16M9 10v7l3-2 3 2v-7"/></svg></span>My Orders
              </Link>
              <Link href="/myprofile" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20v-1.2a7 7 0 0 1 14 0V20Z"/></svg></span>My Profile
              </Link>
            </div>
          </div>

          {/* Compare: only while the list has something in it */}
          {compareCount > 0 && (
          <button
            type="button"
            className="navbar-compact-search-toggle"
            aria-label={t.searchOpenAria}
            aria-expanded={isCompactSearchOpen}
            onClick={() => {
              setIsCompactSearchOpen(true);
              window.requestAnimationFrame(() => searchInputRef.current?.focus());
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" />
              <path d="m16.5 16.5 4 4" />
            </svg>
          </button>

          {/* Compare (placed directly next to search toggle) */}
          <button
            type="button"
            className="navbar-action-item navbar-compare-action"
            aria-label={`${t.compare} (${compareCount})`}
            onClick={() => setIsCompareOpen(true)}
          >
            <div className="navbar-action-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 3l4 4-4 4" />
                <path d="M20 7H4" />
                <path d="M8 21l-4-4 4-4" />
                <path d="M4 17h16" />
              </svg>
              <span className="navbar-cart-badge">{compareCount}</span>
            </div>
            <span className="navbar-action-label">{t.compare}</span>
          </button>
          )}

          {/* Delivery */}
          <Link href="/deliveryService" className="navbar-compact-delivery" aria-label={t.deliveryService}>
            <svg viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5.5h14v12H2z"/><path d="M16 10h5l4 4.25v3.25h-9z"/><path d="M21 10v4.5h4"/><circle cx="6.5" cy="19" r="2.25"/><circle cx="21" cy="19" r="2.25"/><path d="M3 8h5"/></svg>
            <span>{t.deliveryCompact}</span>
          </Link>
          <Link
            href="/deliveryService"
            className="navbar-delivery-service"
            aria-label={t.deliveryService}
          >
            <span className="navbar-delivery-icon-wrap">
              <svg
                viewBox="0 0 32 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 5h17v13H2z" />
                <path d="M19 9h5l5 5v4H19z" />
                <circle cx="8" cy="19" r="2.5" />
                <circle cx="24" cy="19" r="2.5" />
                <path d="M5 9h8M5 13h6M22 11h2l3 3h-5z" />
              </svg>
            </span>
            <span className="navbar-delivery-copy">
              <span className="navbar-delivery-label">{t.deliveryService}</span>
              <span className="navbar-delivery-caption">{t.deliveryCaption}</span>
            </span>
            <span className="navbar-delivery-badge">{t.deliveryBadge}</span>
          </Link>

          {/* Account */}
          <div className="navbar-account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="navbar-action-item"
              aria-label={t.account}
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              onClick={() => setIsAccountOpen(open => !open)}
            >
              <div className="navbar-action-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="navbar-action-label">{t.account}</span>
            </button>
            <div className={`navbar-account-dropdown${isAccountOpen ? " is-open" : ""}`} role="menu" aria-label={t.account} aria-hidden={!isAccountOpen}>
              <button type="button" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => { setIsAccountOpen(false); setIsLoginOpen(true); }}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/><path d="M10 16l4-4-4-4M14 12H3"/></svg></span>{t.login}
              </button>
              <Link href="/wishlist" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/></svg></span>{t.wishlist}
              </Link>
              <Link href="/myOrders" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12l2 3v15H4V6l2-3Z"/><path d="M4 6h16M9 10v7l3-2 3 2v-7"/></svg></span>{t.myOrders}
              </Link>
              <Link href="/myprofile" role="menuitem" tabIndex={isAccountOpen ? 0 : -1} onClick={() => setIsAccountOpen(false)}>
                <span className="navbar-account-option-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="7.5" r="3.5"/><path d="M5 20v-1.2a7 7 0 0 1 14 0V20Z"/></svg></span>{t.myProfile}
              </Link>
              <div className="navbar-account-lang-divider" />
              <div className="navbar-account-lang-box">
                <span className="navbar-account-lang-label">Language:</span>
                <div className="navbar-account-lang-buttons">
                  <button
                    type="button"
                    className={`navbar-lang-pill${currentLang === "en" ? " is-active" : ""}`}
                    onClick={() => changeLanguage("en")}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`navbar-lang-pill${currentLang === "bn" ? " is-active" : ""}`}
                    onClick={() => changeLanguage("bn")}
                  >
                    বাং
                  </button>
                  <button
                    type="button"
                    className={`navbar-lang-pill${currentLang === "hi" ? " is-active" : ""}`}
                    onClick={() => changeLanguage("hi")}
                  >
                    हिं
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cart */}
          <button
            type="button"
            className="navbar-action-item navbar-cart-action"
            aria-label={`${t.cart} (${visibleCartCount})`}
            onClick={() => setIsCartOpen(true)}
          >
            <div className="navbar-action-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="navbar-cart-badge">{visibleCartCount}</span>
            </div>
            <span className="navbar-action-label">{t.cart}</span>
          </button>
        </nav>
      </div>

      {isCartOpen && (
        <Cart
          onClose={() => setIsCartOpen(false)}
          items={hasCustomCart ? cartItems : undefined}
          onItemsChange={handleCartItemsChange}
        />
      )}
      {isCompareOpen && (
        <CompareList
          onClose={() => setIsCompareOpen(false)}
          onContinueCompare={(selected) => {
            setIsCompareOpen(false);
            setCompareDetailsProducts(selected);
            setIsCompareDetailsOpen(true);
          }}
        />
      )}
      {isCompareDetailsOpen && (
        <CompareDetails
          products={compareDetailsProducts}
          onClose={() => setIsCompareDetailsOpen(false)}
          onBackToList={() => {
            setIsCompareDetailsOpen(false);
            setIsCompareOpen(true);
          }}
        />
      )}
      {selectedProduct && (
        <AddToCart
          key={selectedProduct.id}
          product={selectedProduct}
          locale="en-IN"
          currency="INR"
          saved={savedProducts.includes(selectedProduct.id)}
          onToggleWishlist={() => setSavedProducts(toggleWishlistId(selectedProduct.id))}
          onClose={closeProductDetails}
          onOpenProduct={setSelectedProduct}
          onAddToCart={addCartItem}
          onUpdateCartQuantity={updateCartQuantity}
        />
      )}
      {isLocationOpen && <Location onClose={() => setIsLocationOpen(false)} onLogin={() => { setIsLocationOpen(false); setIsLoginOpen(true); }} />}
      {isLoginOpen && <Login onClose={() => setIsLoginOpen(false)} />}
    </header>
  );
}
