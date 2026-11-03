"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { loadCategoriesAction } from "@/app/actions";
import type { CategoryTile } from "@/components/category/Category";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "@/app/(frontend)/allCategory/english.json";
import bengaliText from "@/app/(frontend)/allCategory/bengali.json";
import hindiText from "@/app/(frontend)/allCategory/hindi.json";
import "../../category/Category.css";
import "./ResponsiveCategory.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function getCategoryCardStyle(category: CategoryTile): CSSProperties & { "--category-shadow-color": string } {
  return {
    backgroundColor: category.color,
    "--category-shadow-color": category.color,
  };
}

export default function ResponsiveCategory({ open, onClose }: Props) {
  const [language] = useLanguage();
  const text = textMap[language];
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [items, setItems] = useState<CategoryTile[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollContainer = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");

    try {
      const result = await loadCategoriesAction(nextPage);
      if ("error" in result) {
        setError(nextPage === 1 ? text.couldNotLoad : text.couldNotLoadMore);
      } else {
        setItems((current) => {
          if (nextPage === 1 || !current) return result.items;
          const seen = new Set(current.map((category) => category.id));
          return [...current, ...result.items.filter((category) => !seen.has(category.id))];
        });
        setPage(nextPage);
        setHasMore(result.hasMore);
      }
    } catch {
      setError(nextPage === 1 ? text.couldNotLoad : text.couldNotLoadMore);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [text.couldNotLoad, text.couldNotLoadMore]);

  useEffect(() => {
    let frame = 0;
    let focusFrame = 0;
    let timer = 0;

    if (open) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      frame = window.requestAnimationFrame(() => {
        setIsMounted(true);
        focusFrame = window.requestAnimationFrame(() => {
          setIsVisible(true);
          closeButton.current?.focus();
        });
      });
    } else {
      frame = window.requestAnimationFrame(() => setIsVisible(false));
      timer = window.setTimeout(() => {
        setIsMounted(false);
        previousFocus.current?.focus();
      }, 650);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(focusFrame);
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open || items !== null || loading || error) return;
    const timer = window.setTimeout(() => void loadPage(1), 0);
    return () => window.clearTimeout(timer);
  }, [error, open, items, loading, loadPage]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && !error) void loadPage(page + 1);
  }, [error, hasMore, loadPage, loading, page]);

  useEffect(() => {
    const element = sentinel.current;
    const root = scrollContainer.current;
    if (!open || !element || !root || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "200px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [error, hasMore, loadMore, loading, open]);

  if (!isMounted) return null;

  return createPortal(
    <div
      className={`responsive-category-overlay${isVisible ? " is-visible" : ""}`}
      aria-hidden={!isVisible}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`responsive-category-sheet${isVisible ? " is-visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="responsive-category-heading"
        lang={text.language}
      >
        <header className="responsive-category-header">
          <div>
            <h2 id="responsive-category-heading">{text.heading}</h2>
            <p>{text.description}</p>
          </div>
          <button
            ref={closeButton}
            className="responsive-category-close"
            type="button"
            aria-label={text.closeCategoryModal}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </header>

        <div className="responsive-category-scroll" ref={scrollContainer}>
          {items && (
            <ul className="responsive-category-grid" aria-label={text.allCategoriesLabel}>
              {items.map((category) => {
                const categoryName = (text.categoryNames as Record<string, string>)[category.name] || category.name;
                return (
                  <li key={category.id}>
                    <Link
                      className="category-card"
                      href={category.href ?? `/products?category=${encodeURIComponent(category.name)}`}
                      style={getCategoryCardStyle(category)}
                      onClick={onClose}
                    >
                      <div className="category-image">
                        <Image
                          src={isRemoteImage(category.image) ? category.image : `${category.image}?v=transparent-2`}
                          unoptimized
                          onError={fallbackImage}
                          draggable={false}
                          alt={categoryName}
                          fill
                          sizes="(max-width: 575px) 44vw, 220px"
                        />
                      </div>
                      <div className="category-details">
                        <h3>{categoryName}</h3>
                        <p className="category-count">
                          <strong>{category.types}</strong> {category.types === 1 ? text.productType : text.productTypes}
                        </p>
                        <span className="category-arrow" aria-hidden="true">→</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {loading && (
            <p className="responsive-category-status" role="status">
              {items ? text.loadingMore : text.loadingCategories}
            </p>
          )}
          {error && (
            <p className="responsive-category-status" role="alert">
              {error}{" "}
              <button type="button" onClick={() => void loadPage(items ? page + 1 : 1)}>{text.tryAgain}</button>
            </p>
          )}
          {hasMore && !error && <div ref={sentinel} aria-hidden="true" className="responsive-category-sentinel" />}
          {items && !hasMore && items.length > 0 && (
            <p className="responsive-category-status">{text.allCategoriesEnd}</p>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}