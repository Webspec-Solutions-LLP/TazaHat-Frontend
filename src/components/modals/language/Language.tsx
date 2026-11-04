"use client";

import { useBackClose } from "@/lib/backLayers";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "@/app/(frontend)/profile/english.json";
import bengaliText from "@/app/(frontend)/profile/bengali.json";
import hindiText from "@/app/(frontend)/profile/hindi.json";
import "./Language.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface LanguageProps {
  onClose: () => void;
}

const options: { value: SupportedLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
  { value: "hi", label: "हिन्दी" },
];

export default function Language({ onClose }: LanguageProps) {
  const [language, setLanguage] = useLanguage();
  const t = textMap[language] || englishText;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => setClosing(true), []);
  useBackClose(close);

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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : window.matchMedia("(max-width: 575px)").matches ? 650 : 400;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const chooseLanguage = (value: SupportedLang) => {
    if (closing) return;
    setLanguage(value);
    setClosing(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className={`language-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <section className="language-panel" aria-label={t.languageTitle}>
        <h2 className="language-heading" id={titleId}>{t.languageTitle}</h2>
        <div className="language-options" role="group" aria-label={t.languageTitle}>
          {options.map((option) => (
            <button
              className="language-option"
              type="button"
              key={option.value}
              aria-pressed={language === option.value}
              lang={option.value}
              onClick={() => chooseLanguage(option.value)}
            >
              <span>{option.label}</span>
              <span className={`language-radio${language === option.value ? " is-selected" : ""}`} aria-hidden="true">
                {language === option.value && (
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>
    </dialog>
  );
}