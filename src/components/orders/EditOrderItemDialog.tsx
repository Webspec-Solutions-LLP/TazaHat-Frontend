"use client";

import { useEffect, useRef, useState } from "react";
import { getProductDetailAction } from "@/app/actions";
import type { MyOrderDetail } from "@/app/checkout-actions";
import { shortName, type ApiProductDetail } from "@/lib/api";
import { useBackClose } from "@/lib/backLayers";
import "./AddToOrderDialog.css";
import "./EditOrderItemDialog.css";

type Item = MyOrderDetail["items"][number];
const money = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

/**
 * Change one item of an order that is not processed yet: another size, another dressing, the quantity, the note. The choices are
 * what the shop offers right now (sizes in stock in the city, the product's dressing types), like on the product page.
 */
export default function EditOrderItemDialog({ item, onSave, onClose }: {
  item: Item;
  /** send the change; return an error text when it was refused */
  onSave: (change: { variantId: string; cuttingTypeId: string | null; quantity: number; instruction: string | null }) => Promise<string | null>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [detail, setDetail] = useState<ApiProductDetail | null | undefined>(undefined);
  const [variantId, setVariantId] = useState(item.variantId ?? "");
  const [dressingId, setDressingId] = useState(item.cuttingTypeId ?? "");
  const [quantity, setQuantity] = useState(item.quantity);
  const [instruction, setInstruction] = useState(item.instruction ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (!item.slug) { setDetail(null); return; }
    getProductDetailAction(item.slug).then(d => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [item.slug]);

  const packs = detail?.packs ?? [];
  const pack = packs.find(p => p.id === variantId);
  const dressing = detail?.cutting.find(c => c.id === dressingId);
  const isCustom = !!dressing && /custom/i.test(dressing.name);
  const dressingStillOffered = !item.cuttingTypeId || !!detail?.cutting.some(c => c.id === item.cuttingTypeId);
  const changedKind = variantId !== (item.variantId ?? "") || dressingId !== (item.cuttingTypeId ?? "");
  // the chosen size + dressing for one piece, as of today (only shown when the size or dressing is changed: otherwise the line keeps the price it was ordered at)
  const dressPaisa = dressing ? (pack?.grams ? Math.round((dressing.chargePaisa * pack.grams) / 1000) : dressing.chargePaisa) : 0;
  const unit = pack ? pack.pricePaisa + dressPaisa : 0;
  const dirty = changedKind || quantity !== item.quantity || (instruction.trim() || "") !== (item.instruction ?? "");

  const save = async () => {
    if (saving || !dirty) return;
    if (!pack) return setError("Please choose a size.");
    if (detail?.dressingRequired && !dressing) return setError("Please choose a dressing type.");
    if (!pack.inStock) return setError("This size is not available right now.");
    setSaving(true);
    setError("");
    const problem = await onSave({ variantId, cuttingTypeId: dressingId || null, quantity, instruction: isCustom ? instruction.trim() || null : null });
    setSaving(false);
    if (problem) setError(problem); else close();
  };

  return (
    <dialog ref={ref} className={`ato-dialog${closing ? " is-closing" : ""}`} aria-label={`Edit ${item.name}`} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <section className="ato-panel">
        <header className="ato-header">
          <div><h2>Edit item</h2><p>{item.name}</p></div>
          <button type="button" className="ato-close" aria-label="Close" onClick={close}>×</button>
        </header>
        <div className="eoi-body">
          {detail === undefined && <p className="ato-empty">Loading what is available now…</p>}
          {detail === null && <p className="ato-message is-bad">This product is not available in your city right now, so it cannot be changed. You can cancel the item instead.</p>}
          {detail && (
            <>
              <fieldset className="eoi-group">
                <legend>Size</legend>
                {packs.map(p => {
                  const orderable = p.inStock;
                  return (
                    <label key={p.id} className={`eoi-option${variantId === p.id ? " is-on" : ""}${orderable ? "" : " is-off"}`}>
                      <input type="radio" name="pack" disabled={!orderable} checked={variantId === p.id} onChange={() => { setVariantId(p.id); setError(""); }} />
                      <span>{p.label}</span>
                      <b>{orderable ? money(p.pricePaisa) : p.availableFromLabel ? `Available ${p.availableFromLabel}` : "Out of stock"}</b>
                    </label>
                  );
                })}
                {!pack && item.variantId && <p className="eoi-note">The size you ordered ({item.packLabel ?? "this size"}) is not on sale right now. Please choose another one.</p>}
              </fieldset>

              {detail.cutting.length > 0 && (
                <fieldset className="eoi-group">
                  <legend>Dressing type{detail.dressingRequired ? " *" : ""}</legend>
                  {!dressingStillOffered && <p className="eoi-note">The dressing you chose ({item.dressing ? shortName(item.dressing) : "earlier"}) is not offered any more. Please choose another one.</p>}
                  <select value={dressingId} onChange={e => { setDressingId(e.target.value); setError(""); }} aria-label="Dressing type">
                    <option value="">{detail.dressingRequired ? "Select dressing type" : "No dressing"}</option>
                    {detail.cutting.map(c => (
                      <option key={c.id} value={c.id}>{shortName(c.name)}{c.chargePaisa > 0 ? ` (+${money(pack?.grams ? Math.round((c.chargePaisa * pack.grams) / 1000) : c.chargePaisa)})` : ""}</option>
                    ))}
                  </select>
                  {isCustom && <textarea rows={2} maxLength={200} placeholder="Type your instruction" value={instruction} onChange={e => setInstruction(e.target.value)} aria-label="Instruction" />}
                </fieldset>
              )}

              <div className="eoi-qty">
                <span>Quantity</span>
                <span className="eoi-stepper">
                  <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <b>{quantity}</b>
                  <button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => setQuantity(q => Math.min(99, q + 1))}>+</button>
                </span>
              </div>
              {changedKind && pack ? <p className="eoi-price">New price: <b>{money(unit * quantity)}</b> <small>({money(unit)} each, as of today)</small></p>
                : <p className="eoi-price">Ordered price: <b>{money(item.estimatedLinePaisa / item.quantity * quantity)}</b> <small>(your original price stays)</small></p>}
            </>
          )}
          {error && <p className="ato-message is-bad" role="alert">{error}</p>}
        </div>
        <footer className="ato-footer eoi-footer">
          <button type="button" className="eoi-cancel" onClick={close}>Close</button>
          <button type="button" disabled={saving || !detail || !dirty} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
        </footer>
      </section>
    </dialog>
  );
}
