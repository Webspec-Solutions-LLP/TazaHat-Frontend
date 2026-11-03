"use client";

import { useEffect, useState } from "react";
import {
  COMPARE_CHANGE_EVENT,
  COMPARE_STORAGE_KEY,
  type CompareProduct,
} from "@/components/modals/compareList/CompareList";
import "./CompareButton.css";

export default function CompareButton({
  product,
  label,
  addedLabel,
  className = "product-compare",
}: {
  product: CompareProduct;
  label: string;
  addedLabel: string;
  className?: string;
}) {
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try {
        const stored: unknown = JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]");
        setIsCompared(Array.isArray(stored) && stored.some((item) => item && typeof item === "object" && "id" in item && item.id === product.id));
      } catch {
        setIsCompared(false);
      }
    };

    refresh();
    window.addEventListener(COMPARE_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(COMPARE_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [product.id]);

  const addToCompare = () => {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    let stored: unknown = [];
    try {
      stored = raw ? JSON.parse(raw) : [];
    } catch {
      stored = [];
    }
    const items: CompareProduct[] = Array.isArray(stored)
      ? stored.filter((item): item is CompareProduct => item && typeof item === "object" && "id" in item && typeof item.id === "string")
      : [];
    const existingIndex = items.findIndex((item) => item.id === product.id);
    if (existingIndex < 0) items.push(product);
    else items[existingIndex] = product;
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(COMPARE_CHANGE_EVENT));
    setIsCompared(true);
  };

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isCompared}
      aria-label={(isCompared ? addedLabel : label).replace("{name}", product.name)}
      title={(isCompared ? addedLabel : label).replace("{name}", product.name)}
      onClick={addToCompare}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 3l4 4-4 4" />
        <path d="M20 7H4" />
        <path d="M8 21l-4-4 4-4" />
        <path d="M4 17h16" />
      </svg>
    </button>
  );
}
