"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cartRelatedAction, searchSuggestionsAction } from "@/app/actions";
import Variant from "@/components/modals/variant/Variant";
import type { CartItem } from "@/components/modals/cart/Cart";
import { fallbackImage, isRemoteImage, type Product } from "@/lib/api";
import { useBackClose } from "@/lib/backLayers";
import "./AddToOrderDialog.css";

/**
 * "Add items" on an order that is not processed yet: search the shop (or pick from what goes with the order), choose the size and
 * dressing in the same pop-up the shop uses, and the item goes into the ORDER (not the cart).
 */
export default function AddToOrderDialog({ orderLabel, orderSlugs, cityId, onAdd, onClose }: {
  /** the order's own city: its shop is what can be added */
  cityId?: string;
  orderLabel: string;
  /** products already in the order: the suggestions are things that go with them */
  orderSlugs: string[];
  /** put one chosen item in the order; return an error text when it was refused */
  onAdd: (item: CartItem) => Promise<string | null>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [suggested, setSuggested] = useState<Product[] | null>(null);
  const [picked, setPicked] = useState<Product | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "bad" } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = ""; };
  }, []);
  const close = () => { setClosing(true); window.setTimeout(onClose, 250); };
  useBackClose(close);

  useEffect(() => {
    let cancelled = false;
    cartRelatedAction(orderSlugs, cityId).then(items => { if (!cancelled) setSuggested(items); });
    return () => { cancelled = true; };
  }, [orderSlugs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) { setResults(null); return; }
    let cancelled = false;
    const t = window.setTimeout(() => { searchSuggestionsAction(text, cityId).then(items => { if (!cancelled) setResults(items); }); }, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [query]);

  const shown = results ?? suggested;
  return (
    <dialog ref={ref} className={`ato-dialog${closing ? " is-closing" : ""}`} aria-label={`Add items to ${orderLabel}`} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <section className="ato-panel">
        <header className="ato-header">
          <div><h2>Add items to {orderLabel}</h2><p>Items you add here go into this order. Prices are as of today.</p></div>
          <button type="button" className="ato-close" aria-label="Close" onClick={close}>×</button>
        </header>
        <input className="ato-search" type="search" placeholder="Search fish, meat, vegetables…" value={query} onChange={e => setQuery(e.target.value)} autoFocus aria-label="Search products" />
        {message && <p className={`ato-message is-${message.tone}`} role="status">{message.text}</p>}
        <h3 className="ato-sub">{results ? `Results for “${query.trim()}”` : "You may also like"}</h3>
        <div className="ato-list">
          {shown === null ? <p className="ato-empty">Loading…</p> : shown.length === 0 ? <p className="ato-empty">{results ? "Nothing found. Try another word." : "Search above to find items."}</p> : shown.map(p => (
            <article className="ato-card" key={p.id}>
              <span className="ato-image"><Image src={p.image} alt="" fill sizes="64px" unoptimized={isRemoteImage(p.image)} onError={fallbackImage} /></span>
              <span className="ato-name">{p.name}<small>from ₹{p.price}</small></span>
              <button type="button" disabled={busy} onClick={() => { setMessage(null); setPicked(p); }}>Add</button>
            </article>
          ))}
        </div>
        <footer className="ato-footer"><button type="button" onClick={close}>Done</button></footer>
      </section>
      {picked && (
        <Variant
          cityId={cityId}
          product={picked}
          currency="INR"
          onClose={() => setPicked(null)}
          onGoToCart={async (item: CartItem) => {
            setBusy(true);
            const problem = await onAdd(item);
            setBusy(false);
            setPicked(null);
            setMessage(problem ? { text: problem, tone: "bad" } : { text: `${item.name} was added to your order.`, tone: "ok" });
          }}
        />
      )}
    </dialog>
  );
}
