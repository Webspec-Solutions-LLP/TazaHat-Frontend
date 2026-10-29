"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Cart, { type CartItem } from "../modals/cart/Cart";
import AddToCart from "../modals/AddToCart/AddToCart";
import Location from "../modals/location/Location";
import Login from "../modals/login/Login";
import productCatalog from "../products/english.json";
import { readWishlistIds, subscribeToWishlist, toggleWishlistId } from "../../lib/wishlist";
import "./Navbar.css";

const SEARCH_HISTORY_KEY = "tazahat-search-history";
const MAX_SEARCH_HISTORY = 8;

interface NavbarProps {
  cartCount?: number;
  deliveryLocation?: string;
  onSearch?: (query: string) => void;
}

export default function Navbar({
  cartCount = 0,
  deliveryLocation = "Kolkata, West Bengal",
  onSearch,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [isCompactSearchOpen, setIsCompactSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<(typeof productCatalog.products)[number] | null>(null);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [hasCustomCart, setHasCustomCart] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory: unknown = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory.filter((item): item is string => typeof item === "string").slice(0, MAX_SEARCH_HISTORY));
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
  const handleCartItemsChange = useCallback((items: CartItem[]) => {
    setHasCustomCart(true);
    setCartItems(items);
  }, []);
  const searchResults = searchQuery.trim()
    ? productCatalog.products
        .filter((product) =>
          `${product.name} ${product.category} ${product.subcategory}`
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase())
        )
        .slice(0, 6)
    : [];
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
    const nextHistory = [query, ...searchHistory.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, MAX_SEARCH_HISTORY);
    setSearchHistory(nextHistory);
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // Search still works when storage is disabled or full.
    }
    return query;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = rememberSearch(searchQuery);
    if (!query) return;
    setIsSearchResultsOpen(true);
    onSearch?.(query);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
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

    window.addEventListener("tazahat:add-cart-item", handleSectionAddToCart);
    return () => window.removeEventListener("tazahat:add-cart-item", handleSectionAddToCart);
  }, [addCartItem]);

  const handleAddToCart = (product: (typeof productCatalog.products)[number]) => {
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

  const closeProductDetails = useCallback(() => setSelectedProduct(null), []);

  return (
    <header
      className={`tazahat-navbar${isCompactSearchOpen ? " is-compact-search-open" : ""}`}
      style={{ backgroundColor: "#00366b", color: "#ffffff" }}
    >
      <div className="tazahat-navbar-container">
        {/* Left: Brand Logo & Tagline */}
        <div className="navbar-brand">
          <Link href="/" className="navbar-logo-link" aria-label="TazaHaat Home">
            <Image
              src="/images/logo.webp"
              alt="TazaHaat Logo"
              width={48}
              height={48}
              sizes="48px"
              priority
              className="navbar-logo-img"
            />
            <span className="navbar-brand-copy">
              <span className="navbar-brand-name">Taza<span>Haat</span></span>
              <span className="navbar-tagline">
                Freshness Delivered
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
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
        <form className={`navbar-search-form${isCompactSearchOpen ? " is-compact-open" : ""}`} onSubmit={handleSearchSubmit} role="search">
          <div className="navbar-search-box">
            <span className="navbar-search-overlay-icon" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 4 4"/></svg></span>
            <input
              ref={searchInputRef}
              type="text"
              className="navbar-search-input"
              placeholder="Search for fish, meat, vegetables, fruits, dairy..."
              value={searchQuery}
              onFocus={() => setIsSearchResultsOpen(true)}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query);
                setIsSearchResultsOpen(Boolean(query.trim()));
                if (query.trim()) rememberSearch(query);
              }}
              aria-label="Search products"
              aria-controls="navbar-search-results"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                className="navbar-search-btn"
                aria-label="Clear search"
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
              <button type="submit" className="navbar-search-btn" aria-label="Submit search">
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
            <button type="button" className="navbar-search-overlay-close" aria-label="Close search" onClick={() => setIsCompactSearchOpen(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </div>
          {isSearchResultsOpen && (searchQuery.trim() || searchHistory.length > 0) && (
            <div className="navbar-search-results" id="navbar-search-results" role="list" aria-label="Search results">
              {!searchQuery.trim() ? (
                <>
                  <div className="navbar-search-history-heading">
                    <span>Recent searches</span>
                    <button type="button" onClick={clearSearchHistory}>Clear</button>
                  </div>
                  {searchHistory.map((query) => (
                    <button
                      className="navbar-search-history-item"
                      key={query}
                      type="button"
                      onClick={() => {
                        setSearchQuery(query);
                        setIsSearchResultsOpen(true);
                        rememberSearch(query);
                        onSearch?.(query);
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      <span>{query}</span>
                    </button>
                  ))}
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
                      <Image
                        className="navbar-search-result-image"
                        src={product.image}
                        alt=""
                        width={44}
                        height={44}
                      />
                      <span className="navbar-search-result-info">
                        <span className="navbar-search-result-name">{product.name}</span>
                        <span className="navbar-search-result-meta">{product.weight} · Rs {product.price}</span>
                      </span>
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
                          Add
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="navbar-search-empty">No matching products found.</p>
              )}
            </div>
          )}
        </form>

        {/* Deliver-To / Location Selector */}
        <button type="button" className="navbar-location" aria-label="Select delivery location" onClick={() => setIsLocationOpen(true)}>
          <div className="navbar-location-icon-wrap">
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
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="navbar-location-text">
            <span className="navbar-location-label">Deliver to</span>
            <div className="navbar-location-val-wrap">
              <span className="navbar-location-city">{deliveryLocation}</span>
              <svg
                className="navbar-location-arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </button>

        {/* Right Navigation Actions */}
        <nav className="navbar-actions" aria-label="User navigation">
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

          {/* Cart */}
          <button
            type="button"
            className="navbar-action-item"
            aria-label={`Cart with ${visibleCartCount} items`}
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
            <span className="navbar-action-label">Cart</span>
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
      {selectedProduct && (
        <AddToCart
          key={selectedProduct.id}
          product={selectedProduct}
          locale={productCatalog.locale}
          currency={productCatalog.currency}
          saved={savedProducts.includes(selectedProduct.id)}
          onToggleWishlist={() => setSavedProducts(toggleWishlistId(selectedProduct.id))}
          onClose={closeProductDetails}
          onOpenProduct={setSelectedProduct}
          onAddToCart={addCartItem}
          onUpdateCartQuantity={updateCartQuantity}
        />
      )}
      {isLocationOpen && <Location deliveryLocation={deliveryLocation} onClose={() => setIsLocationOpen(false)} onLogin={() => { setIsLocationOpen(false); setIsLoginOpen(true); }} />}
      {isLoginOpen && <Login onClose={() => setIsLoginOpen(false)} />}
    </header>
  );
}
