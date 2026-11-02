"use client";

import { useEffect, useSyncExternalStore } from "react";

export const LANGUAGE_STORAGE_KEY = "tazahat-language";
export const LANGUAGE_CHANGE_EVENT = "tazahat:change-language";

export type SupportedLang = "en" | "bn" | "hi";

let languageOverride: SupportedLang | undefined;

export function isSupportedLang(value: unknown): value is SupportedLang {
  return value === "en" || value === "bn" || value === "hi";
}

function readStoredLanguage(): SupportedLang {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLang(stored) ? stored : "en";
  } catch {
    return "en";
  }
}

function getLanguageSnapshot(): SupportedLang {
  return languageOverride ?? readStoredLanguage();
}

function subscribeToLanguage(onChange: () => void): () => void {
  const handleLanguageChange = (event: Event) => {
    const next = (event as CustomEvent<unknown>).detail;
    if (!isSupportedLang(next)) return;
    languageOverride = next;
    document.documentElement.lang = next;
    onChange();
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== LANGUAGE_STORAGE_KEY) return;
    languageOverride = isSupportedLang(event.newValue) ? event.newValue : "en";
    window.dispatchEvent(
      new CustomEvent<SupportedLang>(LANGUAGE_CHANGE_EVENT, {
        detail: languageOverride,
      }),
    );
  };

  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

export function setSiteLanguage(language: SupportedLang): void {
  languageOverride = language;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep the current page language even when storage is unavailable.
  }

  document.documentElement.lang = language;
  window.dispatchEvent(
    new CustomEvent<SupportedLang>(LANGUAGE_CHANGE_EVENT, { detail: language }),
  );
}

export function useLanguage(): readonly [SupportedLang, typeof setSiteLanguage] {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    (): SupportedLang => "en",
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return [language, setSiteLanguage] as const;
}
