"use client";

import RequireLogin from "@/components/auth/RequireLogin";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cancelOrderAction, cancelOrderItemAction, editOrderAction, myOrderAction, type MyOrderDetail, type OrderEditInput } from "@/app/checkout-actions";
import AddToOrderDialog from "@/components/orders/AddToOrderDialog";
import CancelReasonDialog from "@/components/orders/CancelReasonDialog";
import EditOrderItemDialog from "@/components/orders/EditOrderItemDialog";
import EditOrderPanel from "@/components/orders/EditOrderPanel";
import CheckoutDialog, { type DialogSpec } from "@/components/checkout/CheckoutDialog";
import type { CartItem } from "@/components/modals/cart/Cart";
import { OrderDetailsSkeleton } from "@/components/skeleton/Skeletons";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { STATUS_TEXT, statusGroup } from "@/lib/orderStatus";
import "./OrderDetails.css";

type Item = MyOrderDetail["items"][number];
const money = (paisa: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paisa / 100);
const when = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: "Asia/Kolkata" });
const PAYMENT_TEXT: Record<string, string> = { COD: "Cash on delivery", ONLINE: "Online payment", UNKNOWN: "—" };
const LATE_CANCEL = "Oh No!!! It's too late to cancel this order now. We have already started working on this order. Cancelling this now may impact Your Account Credit. However we can still submit a cancellation request for further review or you can call our Support team for further assistance. Thank you.";

/** the address as it was when the order was placed (a frozen copy), or the old free text of an old order */
function addressLines(o: MyOrderDetail): string[] {
  const a = o.address;
  if (a) {
    const line = [a.apartment, a.line1, a.line2, a.landmark, a.locality, a.city, a.state, a.pin].filter(Boolean).join(", ");
    return [[a.contactName, a.phone].filter(Boolean).join(" · "), line].filter(Boolean) as string[];
  }
  return o.legacyAddressText ? [o.legacyAddressText] : [];
}

/** what to say about an item: its own status, or that it was cancelled / a cancellation is waiting for the shop */
function itemState(item: Item): { text: string; group: "delivered" | "on-the-way" | "cancelled" | "refunded" } {
  if (item.status === "CANCELLED") return { text: "Cancelled", group: "cancelled" };
  if (item.cancelStatus === "PENDING") return { text: "Cancellation requested", group: "refunded" };
  return { text: STATUS_TEXT[item.status], group: item.status === "DELIVERED" ? "delivered" : "on-the-way" };
}

function Details({ reference }: { reference: string }) {
  const [order, setOrder] = useState<MyOrderDetail | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "bad" } | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [panel, setPanel] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [cancelling, setCancelling] = useState<{ item: Item | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    myOrderAction(reference).then(o => { if (!cancelled) setOrder(o); });
    return () => { cancelled = true; };
  }, [reference]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const refresh = async () => setOrder(await myOrderAction(reference));
  /** one change to the order; the server prices the whole order again, then the page shows the new state */
  const change = async (edit: OrderEditInput, done?: string): Promise<string | null> => {
    setBusy(true);
    const res = await editOrderAction(reference, edit);
    if (res.ok) { await refresh(); if (done) setNotice({ text: done, tone: "ok" }); } else setNotice({ text: res.error, tone: "bad" });
    setBusy(false);
    return res.ok ? null : res.error;
  };

  /** cancel an item (or the whole order when `item` is null): once the shop has started, say it is only a request first */
  const startCancel = (item: Item | null) => {
    if (order?.cancelMode === "request") {
      setDialog({ title: "Confirmation Alert.", icon: "warning", body: <p>{LATE_CANCEL}</p>, buttons: [{ label: "Ok", tone: "primary", onClick: () => setCancelling({ item }) }] });
    } else setCancelling({ item });
  };
  /** the reason was chosen: ask once more before it is sent ("Are you sure?"), then cancel */
  const submitCancel = (reason: string, details: string): Promise<string | null> => new Promise(resolve => {
    const target = cancelling?.item ?? null;
    const what = target ? `“${target.name}”` : `order ${order?.orderNumber ?? ""}`;
    const request = order?.cancelMode === "request";
    setDialog({
      title: request ? "Send cancellation request?" : `Cancel ${target ? "this item" : "this order"}?`, icon: "warning",
      body: <><p>{request ? `We will send a request to cancel ${what} for review.` : `${target ? "This item" : "The whole order"} (${what}) will be cancelled. This cannot be undone.`}</p><p><b>Reason:</b> {reason}{details ? ` - ${details}` : ""}</p></>,
      buttons: [
        { label: request ? "Yes, send request" : "Yes, cancel", tone: "danger", onClick: async () => {
          const res = target ? await cancelOrderItemAction(reference, target.id, reason, details) : await cancelOrderAction(reference, reason, details);
          if (!res.ok) return resolve(res.error);
          setCancelling(null);
          await refresh();
          setNotice({ text: res.requested ? "Your cancellation request was sent. We will confirm it shortly." : target ? `${target.name} was cancelled.` : "Your order was cancelled.", tone: "ok" });
          resolve(null);
        } },
        { label: "No, keep it", tone: "plain", onClick: () => resolve("") },
      ],
    });
  });

  if (order === undefined) return <main className="order-details-page"><div className="order-details-container"><OrderDetailsSkeleton /></div></main>;
  if (order === null) {
    return (
      <main className="order-details-page"><div className="order-details-container">
        <div className="order-details-card"><h2>Order not found</h2><p className="order-details-note">We could not find this order in your account.</p><Link className="order-details-back" href="/orders">Back to My Orders</Link></div>
      </div></main>
    );
  }

  const t = order.totals;
  const group = statusGroup(order.status);
  const pickup = order.deliveryType === "STORE_PICKUP" || order.deliveryType === "WALK_IN";
  const billed = t.billTotalPaisa > 0;
  const lines = addressLines(order);
  const active = order.items.filter(i => i.status !== "CANCELLED");
  const delivered = order.items.filter(i => i.status === "DELIVERED").length;
  const estimatedItems = active.reduce((n, i) => n + i.estimatedLinePaisa - i.dressingUnitPaisa * i.quantity, 0);
  const finalItems = active.reduce((n, i) => n + (i.finalLinePaisa ?? i.estimatedLinePaisa) - i.dressingUnitPaisa * i.quantity, 0);
  const due = Math.max(0, t.billTotalPaisa - order.paidPaisa);
  // fees that were waived or adjusted by the shop: whatever makes the rows add up to the total, so nothing looks unexplained
  const estOther = t.estimatedTotalPaisa - (estimatedItems + t.cuttingFeePaisa + t.deliveryFeePaisa + t.convenienceFeePaisa + t.deliveryTimeFeePaisa - t.couponDiscountPaisa);
  const finalOther = t.billTotalPaisa - (finalItems + t.cuttingFeePaisa + t.deliveryFeePaisa + t.convenienceFeePaisa + t.deliveryTimeFeePaisa + t.adjustmentPaisa - t.discountPaisa);
  // one table: what was estimated when the order was placed next to the final bill (made after packing and weighing)
  const amountRows: { label: string; est: number; fin: number }[] = [
    { label: "Items", est: estimatedItems, fin: finalItems },
    { label: "Dressing fee", est: t.cuttingFeePaisa, fin: t.cuttingFeePaisa },
    { label: "Delivery fee", est: t.deliveryFeePaisa, fin: t.deliveryFeePaisa },
    { label: "Convenience fee", est: t.convenienceFeePaisa, fin: t.convenienceFeePaisa },
    { label: "Fast processing", est: t.deliveryTimeFeePaisa, fin: t.deliveryTimeFeePaisa },
    { label: "Coupon", est: -t.couponDiscountPaisa, fin: 0 },
    { label: "Adjustment", est: 0, fin: t.adjustmentPaisa },
    { label: "Discount", est: 0, fin: -t.discountPaisa },
    { label: "Waived / adjusted", est: Math.abs(estOther) >= 1 ? estOther : 0, fin: Math.abs(finalOther) >= 1 ? finalOther : 0 },
  ].filter(r => r.est !== 0 || (billed && r.fin !== 0));
  const places = pickup ? (order.store ? `${order.store.name}${order.store.areaName ? `, ${order.store.areaName}` : ""}${order.store.pincode ? `, ${order.store.pincode}` : ""}` : "Our store") : lines.join(" · ") || "—";

  return (
    <main className="order-details-page">
      <div className="order-details-container">
        <header className="order-details-heading">
          <div>
            <p>Order details</p>
            <h1>{order.orderNumber}</h1>
          </div>
          <span className={`order-details-status order-details-status--${group}`}>
            <span aria-hidden="true" />
            {STATUS_TEXT[order.status]}
          </span>
          {order.cancelMode && (
            <span className="order-edit-buttons">
              {order.editable && <button type="button" disabled={busy} onClick={() => setPanel(true)}>Edit order</button>}
              {order.editable && <button type="button" className="is-light" disabled={busy} onClick={() => setAdding(true)}>+ Add items</button>}
              <button type="button" className="is-danger" disabled={busy} onClick={() => startCancel(null)}>Cancel order</button>
            </span>
          )}
        </header>

        {notice && <p className={`order-edit-notice is-${notice.tone}`} role="status">{notice.text}</p>}
        {order.cancelReason && order.status === "CANCELLED" && <p className="order-edit-notice is-bad">Cancelled: {order.cancelReason}</p>}
        {order.cancelMode && <p className="order-edit-hint">{order.editable ? "You can still edit, add or cancel items until we start processing this order." : "We have started on this order. You can still send a cancellation request."}</p>}

        <div className="order-layout">
          <aside className="order-side">
            <section className="order-details-card order-summary" aria-label="Order summary">
              <h2>Order summary</h2>
              <dl>
                <div><dt>Placed</dt><dd>{when(order.placedAt, true)}</dd></div>
                <div><dt>{pickup ? "Pickup" : "Delivery"}</dt><dd>{order.deliveryDate ? when(order.deliveryDate) : "—"}{order.deliverySlotLabel ? ` · ${order.deliverySlotLabel.replace(/\s+/g, " ")}` : order.deliverySlotName ? ` · ${order.deliverySlotName}` : ""}</dd></div>
                <div><dt>Payment</dt><dd>{PAYMENT_TEXT[order.paymentMethod] ?? order.paymentMethod}{order.paymentState === "PAID" ? " · Paid" : order.paymentState === "PARTIAL" ? " · Part paid" : ""}</dd></div>
                <div><dt>Items</dt><dd>{active.length} {active.length === 1 ? "item" : "items"}</dd></div>
                <div className="is-wide"><dt>{pickup ? "Pickup store" : "Address"}</dt><dd>{places}</dd></div>
              </dl>
            </section>

            <section className="order-details-card order-amounts" aria-label="Estimated and final amount">
              <table>
                <thead><tr><th scope="col">Amount</th><th scope="col">Estimated</th><th scope="col">Final</th></tr></thead>
                <tbody>
                  {amountRows.map(r => <tr key={r.label}><th scope="row">{r.label}</th><td>{money(r.est)}</td><td>{billed ? money(r.fin) : <span className="order-wait">—</span>}</td></tr>)}
                </tbody>
                <tfoot>
                  <tr className="is-total"><th scope="row">Total</th><td>{money(t.estimatedTotalPaisa)}</td><td>{billed ? money(t.billTotalPaisa) : <span className="order-wait">after packing</span>}</td></tr>
                  {billed && <tr><th scope="row">Paid</th><td /><td>{money(order.paidPaisa)}</td></tr>}
                  {billed && <tr><th scope="row">Due</th><td /><td>{money(due)}</td></tr>}
                </tfoot>
              </table>
              {t.discountPaisa > 0 && <p className="order-amount-saved">You saved {money(t.discountPaisa)} on this order</p>}
              {!billed && order.status !== "CANCELLED" && <p className="order-amount-wait">The final bill is made after your order is packed and weighed, so it can differ a little from the estimate.</p>}
            </section>
          </aside>

          <section className="order-products-card" aria-labelledby="order-products-heading">
            <div className="order-products-heading">
              <div>
                <h2 id="order-products-heading">Products in this order</h2>
                <p>{delivered} of {order.items.length} delivered</p>
              </div>
              <span>{order.items.length} {order.items.length === 1 ? "product" : "products"}</span>
            </div>

            <div className="order-products-list">
              {order.items.map(item => {
                const state = itemState(item);
                const name = item.slug ? <Link href={`/${encodeURIComponent(item.slug)}`}>{item.name}</Link> : item.name;
                const weighed = item.weight && item.billedMeasurement > 0;
                return (
                  <article className={`order-product-row${item.status === "CANCELLED" ? " is-cancelled" : ""}`} key={item.id}>
                    <div className="order-product-image">
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" unoptimized={isRemoteImage(item.image)} onError={fallbackImage} />}
                    </div>
                    <div className="order-product-copy">
                      <h3>{name}</h3>
                      <p>
                        Qty {item.quantity}
                        {item.packLabel ? <><span>·</span>{item.packLabel}</> : item.weight && item.orderedMeasurement ? <><span>·</span>{item.orderedMeasurement} gm</> : null}
                        {item.dressing ? <><span>·</span>{item.dressing}</> : null}
                        {item.instruction ? <><span>·</span>“{item.instruction}”</> : null}
                      </p>
                      {item.cancelNote && (item.status === "CANCELLED" || item.cancelStatus !== "NONE") && <p className="order-item-reason">{item.status === "CANCELLED" ? "Cancelled" : item.cancelStatus === "REJECTED" ? "Cancellation not accepted" : "Cancellation requested"}: {item.cancelNote}</p>}
                      {(item.canEdit || item.canCancel) && (
                        <div className="order-item-edit" role="group" aria-label={`Change ${item.name}`}>
                          {item.canEdit && <button type="button" disabled={busy} onClick={() => setEditing(item)}>Edit</button>}
                          {item.canCancel && <button type="button" className="order-item-remove" disabled={busy} onClick={() => startCancel(item)}>Cancel</button>}
                        </div>
                      )}
                    </div>
                    <div className="order-product-amounts">
                      <span className="order-product-est"><small>Est.</small> {money(item.status === "CANCELLED" ? 0 : item.estimatedLinePaisa)}</span>
                      {item.status !== "CANCELLED" && (item.finalLinePaisa !== null
                        ? <span className="order-product-final"><small>Final{weighed ? ` · ${item.billedMeasurement} gm` : ""}</small> {money(item.finalLinePaisa)}</span>
                        : <span className="order-product-final-wait">Final after packing</span>)}
                    </div>
                    <span className={`order-product-status order-product-status--${state.group}`}>
                      <span aria-hidden="true" />
                      {state.text}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {panel && (
        <EditOrderPanel
          order={order}
          busy={busy}
          onClose={() => setPanel(false)}
          onQuantity={(item, delta) => void change({ setQuantity: [{ itemId: item.id, quantity: item.quantity + delta }] })}
          onEditItem={item => setEditing(item)}
          onCancelItem={item => startCancel(item)}
          onAddItems={() => setAdding(true)}
        />
      )}
      {editing && (
        <EditOrderItemDialog
          item={editing}
          cityId={order.cityId ?? undefined}
          onClose={() => setEditing(null)}
          onSave={async change_ => change({ update: [{ itemId: editing.id, variantId: change_.variantId, cuttingTypeId: change_.cuttingTypeId, quantity: change_.quantity, instruction: change_.instruction }] }, `${editing.name} was updated.`)}
        />
      )}
      {adding && (
        <AddToOrderDialog
          orderLabel={order.orderNumber}
          orderSlugs={order.items.map(i => i.slug).filter((x): x is string => !!x)}
          cityId={order.cityId ?? undefined}
          onClose={() => setAdding(false)}
          onAdd={(item: CartItem) => change({ add: [{ variantId: item.variantId ?? "", cuttingTypeId: item.cuttingTypeId ?? null, quantity: item.quantity, instruction: item.instruction ?? null }] })}
        />
      )}
      {cancelling && (
        <CancelReasonDialog
          title={cancelling.item ? "Cancel Item" : "Cancel Order"}
          subject={cancelling.item ? cancelling.item.name : `Order ${order.orderNumber}`}
          request={order.cancelMode === "request"}
          onSubmit={submitCancel}
          onClose={() => setCancelling(null)}
        />
      )}
      {dialog && <CheckoutDialog spec={dialog} onDismiss={() => setDialog(null)} />}
    </main>
  );
}

function OrderDetailsInner() {
  const raw = useParams<{ orderId?: string | string[] }>().orderId;
  const ref = decodeURIComponent((Array.isArray(raw) ? raw[0] : raw) ?? "");
  return <Details reference={ref} key={ref} />;
}

/** Needs a login: without one the page asks the visitor to log in. */
export default function OrderDetailsPage() {
  return <RequireLogin what="your order"><OrderDetailsInner /></RequireLogin>;
}
