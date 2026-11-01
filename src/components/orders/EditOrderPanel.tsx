"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MyOrderDetail } from "@/app/checkout-actions";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { useBackClose } from "@/lib/backLayers";
import "./AddToOrderDialog.css";
import "./EditOrderItemDialog.css";

type Item = MyOrderDetail["items"][number];
const money = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

/** "Edit order": every item of the order with Edit and Cancel, and a way to add more items (all in one side panel). */
export default function EditOrderPanel({ order, onEditItem, onCancelItem, onAddItems, onClose }: {
  order: MyOrderDetail;
  onEditItem: (item: Item) => void;
  onCancelItem: (item: Item) => void;
  onAddItems: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = ""; };
  }, []);
  const close = () => { setClosing(true); window.setTimeout(onClose, 250); };
  useBackClose(close);
  const items = order.items.filter(i => i.status !== "CANCELLED");

  return (
    <dialog ref={ref} className={`ato-dialog${closing ? " is-closing" : ""}`} aria-label={`Edit ${order.orderNumber}`} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <section className="ato-panel">
        <header className="ato-header">
          <div><h2>Edit {order.orderNumber}</h2><p>Change an item, cancel an item or add more until we start processing your order.</p></div>
          <button type="button" className="ato-close" aria-label="Close" onClick={close}>×</button>
        </header>
        <div className="ato-list eop-list">
          {items.map(item => (
            <article className="eop-item" key={item.id}>
              <span className="ato-image">{item.image && <Image src={item.image} alt="" fill sizes="56px" unoptimized={isRemoteImage(item.image)} onError={fallbackImage} />}</span>
              <span className="ato-name">{item.name}<small>{[item.packLabel, `Qty ${item.quantity}`, item.dressing].filter(Boolean).join(" · ")} · {money(item.estimatedLinePaisa)}</small></span>
              <span className="eop-actions">
                <button type="button" disabled={!item.canEdit} onClick={() => onEditItem(item)}>Edit</button>
                <button type="button" className="is-danger" disabled={!item.canCancel} onClick={() => onCancelItem(item)}>Cancel</button>
              </span>
            </article>
          ))}
        </div>
        <footer className="ato-footer eoi-footer">
          <button type="button" className="eoi-cancel" onClick={close}>Done</button>
          <button type="button" onClick={onAddItems}>+ Add items</button>
        </footer>
      </section>
    </dialog>
  );
}
