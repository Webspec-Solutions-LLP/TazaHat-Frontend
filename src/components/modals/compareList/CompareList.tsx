"use client";

import { placeholderImage } from "@/lib/brandText";
import { useBackClose } from "@/lib/backLayers";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import "./CompareList.css";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export interface CompareProduct {
  id: string;
  name: string;
  image: string;
  price: number | string;
  originalPrice?: number | string;
  rating?: number;
  reviews?: number;
  unit?: string;
}

export interface CompareListProps {
  onClose: () => void;
  product?: CompareProduct;
  items?: CompareProduct[];
  initialSelectedIds?: string[];
  onRemoveItem?: (id: string) => void;
  onClearAll?: () => void;
  onContinueCompare?: (selectedProducts: CompareProduct[]) => void;
}

export const COMPARE_STORAGE_KEY = "tazahat_compare_list";
export const COMPARE_CHANGE_EVENT = "tazahat:compare-change";
export const OPEN_COMPARE_EVENT = "tazahat:open-compare";

export default function CompareList({
  onClose,
  product,
  items: externalItems,
  initialSelectedIds,
  onRemoveItem,
  onClearAll,
  onContinueCompare,
}: CompareListProps) {
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const hasInitializedRef = useRef(false);

  const [items, setItems] = useState<CompareProduct[]>(() => {
    if (externalItems && externalItems.length > 0) return externalItems;
    if (product) return [product];
    return [];
  });

  const [selectedIds, setSelectedIds] = useState<string[]>(() => initialSelectedIds ?? []);

  useEffect(() => {
    if (initialSelectedIds !== undefined) {
      setSelectedIds(initialSelectedIds);
    }
  }, [initialSelectedIds]);

  useEffect(() => {
    setSelectedIds(prev => {
      const currentIds = items.map(i => i.id);
      return prev.filter(id => currentIds.includes(id));
    });
  }, [items]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    try {
      const stored = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      let list: CompareProduct[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      if (product) {
        const index = list.findIndex(item => item.id === product.id);
        if (index >= 0) {
          list[index] = product;
        } else {
          list.push(product);
        }
        window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
        setItems(list);
      } else if (externalItems && externalItems.length > 0) {
        setItems(externalItems);
      } else {
        setItems(list);
      }
    } catch {
      if (product) {
        setItems([product]);
      }
    }
  }, [product, externalItems]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClose, reduceMotion ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const close = () => setClosing(true);
  useBackClose(close);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleContinueCompare = () => {
    if (selectedIds.length < 2) return;
    if (onContinueCompare) {
      const selected = items.filter(item => selectedIds.includes(item.id));
      onContinueCompare(selected);
    }
    close();
  };

  const handleRemove = (id: string) => {
    setItems(prev => {
      const next = prev.filter(item => item.id !== id);
      try {
        window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
      } catch {}
      return next;
    });
    onRemoveItem?.(id);
  };

  const handleClear = () => {
    setItems([]);
    try {
      window.localStorage.removeItem(COMPARE_STORAGE_KEY);
      window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
    } catch {}
    onClearAll?.();
  };

  const formatPrice = (val?: number | string) => {
    if (val === undefined || val === null) return "";
    if (typeof val === "string") {
      if (val.startsWith("₹") || val.startsWith("Rs")) return val;
      return `₹${val}`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <dialog
      ref={dialogRef}
      className={`compare-sidebar-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault();
        close();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="compare-sidebar-panel" lang={t.language}>
        <header className="compare-sidebar-header">
          <button
            className="compare-sidebar-close"
            type="button"
            aria-label={t.closeAria}
            onClick={close}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
          <div className="compare-sidebar-title-group">
            <div className="compare-sidebar-heading-row">
              <h2 id={titleId}>{t.title}</h2>
              <span className="compare-sidebar-count-badge" aria-label={t.productsCountAria.replace("{count}", String(items.length))}>
                {items.length}
              </span>
            </div>
            <p className="compare-sidebar-instruction">
              {t.subtitle}
            </p>
          </div>
        </header>

        <div className="compare-sidebar-body">
          {items.length === 0 ? (
            <div className="compare-empty-state">
              <span className="compare-empty-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 3l4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="M8 21l-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
              </span>
              <h3>{t.emptyTitle}</h3>
              <p>{t.emptyDescription}</p>
            </div>
          ) : (
            <ul className="compare-items-list" aria-label={t.itemsListAria}>
              {items.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  // the whole card is the control: a tap anywhere on it selects / deselects (the round mark only shows the state)
                  <li
                    key={item.id}
                    className={`compare-item-card${isSelected ? " is-selected" : ""}`}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={isSelected ? t.deselectForComparisonAria.replace("{name}", item.name) : t.selectForComparisonAria.replace("{name}", item.name)}
                    tabIndex={0}
                    title={isSelected ? t.clickToDeselectTitle : t.clickToSelectTitle}
                    onClick={() => toggleSelect(item.id)}
                    onKeyDown={event => {
                      if (event.key === " " || event.key === "Enter") {
                        event.preventDefault();
                        toggleSelect(item.id);
                      }
                    }}
                  >
                    <span className="compare-item-select-wrap">
                      <input type="checkbox" checked={isSelected} readOnly tabIndex={-1} aria-hidden="true" className="compare-item-radio-input" />
                      <span className="compare-item-radio-custom" aria-hidden="true">
                        <span className="compare-item-radio-dot" />
                      </span>
                    </span>

                    <div className="compare-item-image">
                      <Image
                        src={item.image || placeholderImage()}
                        alt={item.name}
                        fill
                        sizes="96px"
                        unoptimized={isRemoteImage(item.image || placeholderImage())}
                        onError={fallbackImage}
                        className="compare-item-img"
                      />
                    </div>
                    <div className="compare-item-details">
                      <div className="compare-item-header">
                        <h3 className="compare-item-name" title={item.name}>
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          className="compare-item-remove"
                          aria-label={t.deleteItemAria.replace("{name}", item.name)}
                          title={t.deleteItemAria.replace("{name}", item.name)}
                          onClick={event => {
                            event.stopPropagation();
                            handleRemove(item.id);
                          }}
                          onKeyDown={event => event.stopPropagation()}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>

                      {Number(item.rating ?? 0) > 0 && (
                      <div className="compare-item-rating">
                        <span className="compare-stars" aria-hidden="true">★</span>
                        <strong className="compare-rating-val">
                          {Number(item.rating ?? 0).toFixed(1)}
                        </strong>
                        {item.reviews !== undefined && (
                          <span className="compare-reviews-val">
                            ({item.reviews})
                          </span>
                        )}
                      </div>
                      )}

                      <div className="compare-item-price-wrap">
                        <strong className="compare-price-val">
                          {formatPrice(item.price)}
                        </strong>
                        {item.originalPrice && (
                          <del className="compare-original-val">
                            {formatPrice(item.originalPrice)}
                          </del>
                        )}
                        {item.unit && (
                          <span className="compare-unit-val">
                            {t.perUnit.replace("{unit}", item.unit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="compare-sidebar-footer">
          {items.length > 0 && (
            <button
              type="button"
              className="compare-clear-btn"
              onClick={handleClear}
            >
              {t.clearAll}
            </button>
          )}
          <button
            type="button"
            className="compare-done-btn"
            disabled={items.length > 0 && selectedIds.length < 2}
            onClick={items.length === 0 ? close : handleContinueCompare}
            title={
              items.length === 0
                ? t.close
                : selectedIds.length >= 2
                ? t.continueCompareTitle
                : t.selectMoreTitle
                    .replace("{count}", String(2 - selectedIds.length))
                    .replace(
                      "{unit}",
                      2 - selectedIds.length === 1 ? t.moreProductSingle : t.moreProductPlural
                    )
            }
          >
            {items.length > 0 ? t.continueCompare : t.close}
          </button>
        </footer>
      </section>
    </dialog>
  );
}
