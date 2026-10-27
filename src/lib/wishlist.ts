const WISHLIST_STORAGE_KEY = "tazahat-wishlist";
const WISHLIST_CHANGE_EVENT = "tazahat:wishlist-change";

export function getWishlistSnapshot(): string {
  return window.localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]";
}

export function getServerWishlistSnapshot(): string {
  return "[]";
}

export function parseWishlistSnapshot(snapshot: string): string[] {
  const parsed: unknown = JSON.parse(snapshot);
  if (!Array.isArray(parsed) || !parsed.every((id): id is string => typeof id === "string")) {
    throw new Error("Stored wishlist data is invalid.");
  }
  return parsed;
}

export function readWishlistIds(): string[] {
  return parseWishlistSnapshot(getWishlistSnapshot());
}

export function toggleWishlistId(productId: string): string[] {
  const current = readWishlistIds();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
  return next;
}

export function subscribeToWishlist(onChange: () => void): () => void {
  window.addEventListener(WISHLIST_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(WISHLIST_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
