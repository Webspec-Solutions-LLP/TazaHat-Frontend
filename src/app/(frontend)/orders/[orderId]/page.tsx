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
  const submitCancel = async (reason: string, details: string): Promise<string | null> => {
    const target = cancelling?.item ?? null;
    const res = target ? await cancelOrderItemAction(reference, target.id, reason, details) : await cancelOrderAction(reference, reason, details);
    if (!res.ok) return res.error;
    setCancelling(null);
    await refresh();
    setNotice({ text: res.requested ? "Your cancellation request was sent. We will confirm it shortly." : target ? `${target.name} was cancelled.` : "Your order was cancelled.", tone: "ok" });
    return null;
  };

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
  const row = (label: string, paisa: number, show = true) => (show ? <div key={label}><span>{label}</span><span>{money(paisa)}</span></div> : null);

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
        </header>

        {notice && <p className={`order-edit-notice is-${notice.tone}`} role="status">{notice.text}</p>}
        {order.cancelReason && order.status === "CANCELLED" && <p className="order-edit-notice is-bad">Cancelled: {order.cancelReason}</p>}
        {order.cancelMode && (
          <section className="order-edit-bar" aria-label="Change this order">
            <p>{order.editable
              ? <><strong>You can still change this order.</strong> Edit an item, cancel an item or add more until we start processing it.</>
              : <><strong>We have started on this order.</strong> You can still send a cancellation request for an item or for the order.</>}</p>
            <span className="order-edit-buttons">
              {order.editable && <button type="button" disabled={busy} onClick={() => setPanel(true)}>Edit order</button>}
              {order.editable && <button type="button" className="is-light" disabled={busy} onClick={() => setAdding(true)}>+ Add items</button>}
              <button type="button" className="is-danger" disabled={busy} onClick={() => startCancel(null)}>Cancel order</button>
            </span>
          </section>
        )}

        <section className="order-details-card" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Order date</dt><dd>{when(order.placedAt, true)}</dd></div>
            <div><dt>{pickup ? "Pickup" : "Delivery"} date</dt><dd>{order.deliveryDate ? when(order.deliveryDate) : "—"}{order.deliverySlotLabel ? ` · ${order.deliverySlotLabel.replace(/\s+/g, " ")}` : order.deliverySlotName ? ` · ${order.deliverySlotName}` : ""}</dd></div>
            <div><dt>Items</dt><dd>{active.length} {active.length === 1 ? "item" : "items"}</dd></div>
            <div><dt>Payment</dt><dd>{PAYMENT_TEXT[order.paymentMethod] ?? order.paymentMethod}{order.paymentState === "PAID" ? " · Paid" : order.paymentState === "PARTIAL" ? " · Part paid" : ""}</dd></div>
            <div><dt>{pickup ? "Pickup store" : "Delivery address"}</dt><dd>{pickup ? (order.store ? `${order.store.name}${order.store.areaName ? `, ${order.store.areaName}` : ""}${order.store.pincode ? `, ${order.store.pincode}` : ""}` : "Our store") : lines.length ? lines.map(l => <span key={l} style={{ display: "block" }}>{l}</span>) : "—"}</dd></div>
          </dl>
        </section>

        <div className="order-amounts">
          <section className="order-details-card order-amount-card" aria-label="Estimated amount">
            <h2>Estimated <small>at the time of order</small></h2>
            <div className="order-amount-rows">
              {row("Item price", estimatedItems)}
              {row("Dressing fee", t.cuttingFeePaisa, t.cuttingFeePaisa > 0)}
              {row("Delivery fee", t.deliveryFeePaisa, t.deliveryFeePaisa > 0)}
              {row("Convenience fee", t.convenienceFeePaisa, t.convenienceFeePaisa > 0)}
              {row("Fast processing charge", t.deliveryTimeFeePaisa, t.deliveryTimeFeePaisa > 0)}
              {row("You saved", t.discountPaisa, t.discountPaisa > 0)}
              {row("Coupon", -t.couponDiscountPaisa, t.couponDiscountPaisa > 0)}
            </div>
            <div className="order-amount-total"><span>Estimated total</span><strong>{money(t.estimatedTotalPaisa)}</strong></div>
          </section>
          <section className={`order-details-card order-amount-card${billed ? "" : " is-waiting"}`} aria-label="Final amount">
            <h2>Final <small>after packing and weighing</small></h2>
            {billed ? (
              <>
                <div className="order-amount-rows">
                  {row("Final item price", finalItems)}
                  {row("Dressing fee", t.cuttingFeePaisa, t.cuttingFeePaisa > 0)}
                  {row("Delivery fee", t.deliveryFeePaisa, t.deliveryFeePaisa > 0)}
                  {row("Convenience fee", t.convenienceFeePaisa, t.convenienceFeePaisa > 0)}
                  {row("Fast processing charge", t.deliveryTimeFeePaisa, t.deliveryTimeFeePaisa > 0)}
                  {row("Adjustment", t.adjustmentPaisa, t.adjustmentPaisa !== 0)}
                  {row("You saved", t.discountPaisa, t.discountPaisa > 0)}
                  {row("Paid", order.paidPaisa, order.paidPaisa > 0)}
                  {row("Due", due)}
                </div>
                <div className="order-amount-total"><span>Final total</span><strong>{money(t.billTotalPaisa)}</strong></div>
              </>
            ) : (
              <p className="order-amount-wait">{order.status === "CANCELLED" ? "This order was cancelled, so there is no final bill." : "Your final bill is made after your order is packed and weighed. We bill on the actual weight of the products, so it can differ a little from the estimate."}</p>
            )}
          </section>
        </div>

        <section className="order-products-card" aria-labelledby="order-products-heading">
          <div className="order-products-heading">
            <div>
              <h2 id="order-products-heading">Products in this order</h2>
              <p>{delivered} of {order.items.length} products delivered</p>
            </div>
            <span>{order.items.length} {order.items.length === 1 ? "product" : "products"}</span>
          </div>

          <div className="order-products-list">
            {order.items.map(item => {
              const state = itemState(item);
              const name = item.slug ? <Link href={`/${encodeURIComponent(item.slug)}`}>{item.name}</Link> : item.name;
              const weighed = item.weight && item.billedMeasurement > 0;
              return (
                <article className="order-product-row" key={item.id}>
                  <div className="order-product-image">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="(max-width: 600px) 72px, 88px" unoptimized={isRemoteImage(item.image)} onError={fallbackImage} />}
                  </div>
                  <div className="order-product-copy">
                    <h3>{name}</h3>
                    <p>
                      Qty: {item.quantity}
                      {item.packLabel ? <><span>·</span>{item.packLabel}</> : item.weight && item.orderedMeasurement ? <><span>·</span>{item.orderedMeasurement} gm</> : null}
                    </p>
                    {(item.dressing || item.instruction) && <p>{[item.dressing, item.instruction ? `“${item.instruction}”` : ""].filter(Boolean).join(" · ")}</p>}
                    {item.cancelNote && (item.status === "CANCELLED" || item.cancelStatus !== "NONE") && <p className="order-item-reason">{item.status === "CANCELLED" ? "Cancelled" : item.cancelStatus === "REJECTED" ? "Cancellation not accepted" : "Cancellation requested"}: {item.cancelNote}</p>}
                    {(item.canEdit || item.canCancel) && (
                      <div className="order-item-edit" role="group" aria-label={`Change ${item.name}`}>
                        {item.canEdit && <button type="button" disabled={busy} onClick={() => setEditing(item)}>Edit item</button>}
                        {item.canCancel && <button type="button" className="order-item-remove" disabled={busy} onClick={() => startCancel(item)}>Cancel item</button>}
                      </div>
                    )}
                  </div>
                  <div className="order-product-amounts">
                    <strong className="order-product-price">{money(item.status === "CANCELLED" ? 0 : item.estimatedLinePaisa)}</strong>
                    <small>Estimated</small>
                    {item.status !== "CANCELLED" && (item.finalLinePaisa !== null
                      ? <><strong className="order-product-final">{money(item.finalLinePaisa)}</strong><small>Final{weighed ? ` · ${item.billedMeasurement} gm` : ""}</small></>
                      : <small className="order-product-final-wait">Final after packing</small>)}
                  </div>
                  <span className={`order-product-status order-product-status--${state.group}`}>
                    <span aria-hidden="true" />
                    {state.text}
                  </span>
                </article>
              );
            })}
          </div>

          <footer className="order-products-total">
            <span>{billed ? "Final total" : "Estimated total"}</span>
            <strong>{money(billed ? t.billTotalPaisa : t.estimatedTotalPaisa)}</strong>
          </footer>
        </section>
      </div>

      {panel && (
        <EditOrderPanel
          order={order}
          onClose={() => setPanel(false)}
          onEditItem={item => setEditing(item)}
          onCancelItem={item => startCancel(item)}
          onAddItems={() => setAdding(true)}
        />
      )}
      {editing && (
        <EditOrderItemDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async change_ => {
            const problem = await change({ update: [{ itemId: editing.id, variantId: change_.variantId, cuttingTypeId: change_.cuttingTypeId, quantity: change_.quantity, instruction: change_.instruction }] }, `${editing.name} was updated.`);
            return problem;
          }}
        />
      )}
      {adding && (
        <AddToOrderDialog
          orderLabel={order.orderNumber}
          orderSlugs={order.items.map(i => i.slug).filter((x): x is string => !!x)}
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
