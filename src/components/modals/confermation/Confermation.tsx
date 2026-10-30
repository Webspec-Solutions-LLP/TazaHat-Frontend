"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import "./Confermation.css";

export interface ConfermationProps {
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
  productName?: string;
  productImage?: string;
  message?: string;
}

export default function Confermation({
  onClose,
  onYes,
  onNo,
  productName,
  productImage,
  message = "Do you want to compare this to other product?",
}: ConfermationProps) {
  const [isClosing, setIsClosing] = useState(false);
  const titleId = useId();

  const closeWithAnimation = useCallback(
    (callback?: () => void) => {
      if (isClosing) return;
      setIsClosing(true);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        if (callback) {
          callback();
        } else {
          onClose();
        }
      }, reduceMotion ? 0 : 200);
    },
    [isClosing, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWithAnimation();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWithAnimation]);

  const handleYes = () => {
    closeWithAnimation(onYes);
  };

  const handleNo = () => {
    closeWithAnimation(onNo);
  };

  return (
    <div
      className={`confermation-backdrop${isClosing ? " is-closing" : ""}`}
      onClick={event => {
        if (event.target === event.currentTarget) closeWithAnimation();
      }}
      role="presentation"
    >
      <div
        className="confermation-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="confermation-close"
          onClick={() => closeWithAnimation()}
          aria-label="Close confirmation"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="confermation-icon-wrap" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 3l4 4-4 4" />
            <path d="M20 7H4" />
            <path d="M8 21l-4-4 4-4" />
            <path d="M4 17h16" />
          </svg>
        </div>

        <h3 id={titleId} className="confermation-title">
          {message}
        </h3>

        {productName && (
          <div className="confermation-preview">
            {productImage && (
              <span className="confermation-preview-img">
                <Image
                  src={productImage}
                  alt=""
                  fill
                  sizes="28px"
                  style={{ objectFit: "contain" }}
                />
              </span>
            )}
            <span className="confermation-preview-name" title={productName}>
              {productName}
            </span>
          </div>
        )}

        <p className="confermation-desc">
          Compare this item side-by-side with other products in your compare list.
        </p>

        <div className="confermation-actions">
          <button
            type="button"
            className="confermation-btn confermation-no-btn"
            onClick={handleNo}
          >
            No
          </button>
          <button
            type="button"
            className="confermation-btn confermation-yes-btn"
            onClick={handleYes}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
