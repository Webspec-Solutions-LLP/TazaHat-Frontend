"use client";

import RequireLogin from "@/components/auth/RequireLogin";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cancelOrderAction, editOrderAction, myOrderAction, type MyOrderDetail, type OrderEditInput } from "@/app/checkout-actions";
import AddToOrderDialog from "@/components/orders/AddToOrderDialog";
import CheckoutDialog, { type DialogSpec } from "@/components/checkout/CheckoutDialog";
import type { CartItem } from "@/components/modals/cart/Cart";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { OrderDetailsSkeleton } from "@/components/skeleton/Skeletons";
import { STATUS_TEXT, statusGroup } from "@/lib/orderStatus";
import "./OrderDetails.css";

const money = (paisa: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paisa / 100);
const when = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: "Asia/Kolkata" });
const PAYMENT_TEXT: Record<string, string> = { COD: "Cash on delivery", ONLINE: "Online payment", UNKNOWN: "—" };

/** the address as it was when the order was placed (a frozen copy), or the old free text of an old order */
function addressLines(o: MyOrderDetail): string[] {
  const a = o.address;
  if (a) {
    const line = [a.apartment, a.line1, a.line2, a.landmark, a.locality, a.city, a.state, a.pin].filter(Boolean).join(", ");
    return [[a.contactName, a.phone].filter(Boolean).join(" · "), line].filter(Boolean) as string[];
  }
  return o.legacyAddressText ? [o.legacyAddressText] : [];
}

function Details({ reference }: { reference: string }) {
  const [order, setOrder] = useState<MyOrderDetail | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    myOrderAction(reference).then(o => { if (!cancelled) setOrder(o); });
    return () => { cancelled = true; };
  }, [reference]);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "bad" } | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(t);
  }, [notice]);

  /** one change to the order; the server prices the whole order again, then the page shows the new state */
  const change = async (edit: OrderEditInput, done?: string): Promise<string | null> => {
    setBusy(true);
    const res = await editOrderAction(reference, edit);
    if (res.ok) {
      setOrder(await myOrderAction(reference));
      if (done) setNotice({ text: done, tone: "ok" });
    } else setNotice({ text: res.error, tone: "bad" });
    setBusy(false);
    return res.ok ? null : res.error;
  };
  const askRemove = (id: string, name: string) => setDialog({
    title: "Remove this item?", icon: "warning", body: <p>{name} will be taken out of your order.</p>,
    buttons: [{ label: "Yes, remove", tone: "danger", onClick: () => void change({ remove: [id] }, `${name} was removed from your order.`) }, { label: "Keep it", tone: "plain", onClick: () => undefined }],
  });
  const askCancel = () => setDialog({
    title: "Cancel this order?", icon: "warning", body: <p>The whole order will be cancelled. This cannot be undone.</p>,
    buttons: [{ label: "Yes, cancel order", tone: "danger", onClick: async () => {
      setBusy(true);
      const res = await cancelOrderAction(reference);
      if (res.ok) { setOrder(await myOrderAction(reference)); setNotice({ text: "Your order was cancelled.", tone: "ok" }); } else setNotice({ text: res.error, tone: "bad" });
      setBusy(false);
    } }, { label: "Keep my order", tone: "plain", onClick: () => undefined }],
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
  const delivered = order.items.filter(i => i.status === "DELIVERED").length;
  const fees: [string, number][] = [
    ["Items", order.items.reduce((n, i) => n + (billed ? i.linePaisa - i.dressingUnitPaisa * i.quantity : i.estimatedLinePaisa - i.dressingUnitPaisa * i.quantity), 0)],
    ["Dressing fee", t.cuttingFeePaisa], ["Delivery fee", t.deliveryFeePaisa], ["Convenience fee", t.convenienceFeePaisa], ["Fast processing charge", t.deliveryTimeFeePaisa],
  ];

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

        <section className="order-details-card" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Order date</dt><dd>{when(order.placedAt, true)}</dd></div>
            <div><dt>{pickup ? "Pickup" : "Delivery"} date</dt><dd>{order.deliveryDate ? when(order.deliveryDate) : "—"}{order.deliverySlotLabel ? ` · ${order.deliverySlotLabel.replace(/\s+/g, " ")}` : order.deliverySlotName ? ` · ${order.deliverySlotName}` : ""}</dd></div>
            <div><dt>Items</dt><dd>{t.itemCount} {t.itemCount === 1 ? "item" : "items"}</dd></div>
            <div><dt>Order total</dt><dd>{money(billed ? t.billTotalPaisa : t.estimatedTotalPaisa)}</dd></div>
            <div><dt>Payment</dt><dd>{PAYMENT_TEXT[order.paymentMethod] ?? order.paymentMethod}{order.paymentState === "PAID" ? " · Paid" : order.paymentState === "PARTIAL" ? " · Part paid" : ""}</dd></div>
            <div><dt>{pickup ? "Pickup store" : "Delivery address"}</dt><dd>{pickup ? (order.store ? `${order.store.name}${order.store.areaName ? `, ${order.store.areaName}` : ""}${order.store.pincode ? `, ${order.store.pincode}` : ""}` : "Our store") : lines.length ? lines.map(l => <span key={l} style={{ display: "block" }}>{l}</span>) : "—"}</dd></div>
          </dl>
        </section>

        {notice && <p className={`order-edit-notice is-${notice.tone}`} role="status">{notice.text}</p>}
        {order.editable && (
          <section className="order-edit-bar" aria-label="Change this order">
            <p><strong>You can still change this order.</strong> Change the quantity, remove items or add more until we start processing it.</p>
            <button type="button" disabled={busy} onClick={() => setAdding(true)}>+ Add items</button>
          </section>
        )}

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
              const itemGroup = item.status === "DELIVERED" ? "delivered" : item.status === "CANCELLED" ? "cancelled" : "on-the-way";
              const name = item.slug ? <Link href={`/${encodeURIComponent(item.slug)}`}>{item.name}</Link> : item.name;
              const weighed = item.weight && item.billedMeasurement > 0 && item.billedMeasurement !== item.orderedMeasurement;
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
                      {weighed ? <><span>·</span>billed {item.billedMeasurement} gm</> : null}
                    </p>
                    {(item.dressing || item.instruction) && <p>{[item.dressing, item.instruction ? `“${item.instruction}”` : ""].filter(Boolean).join(" · ")}</p>}
                    {order.editable && item.status !== "CANCELLED" && (
                      <div className="order-item-edit" role="group" aria-label={`Change ${item.name}`}>
                        <button type="button" aria-label="Decrease quantity" disabled={busy || item.quantity <= 1} onClick={() => void change({ setQuantity: [{ itemId: item.id, quantity: item.quantity - 1 }] })}>−</button>
                        <b aria-live="polite">{item.quantity}</b>
                        <button type="button" aria-label="Increase quantity" disabled={busy || item.quantity >= 99} onClick={() => void change({ setQuantity: [{ itemId: item.id, quantity: item.quantity + 1 }] })}>+</button>
                        <button type="button" className="order-item-remove" disabled={busy || order.items.filter(i => i.status !== "CANCELLED").length <= 1} title={order.items.filter(i => i.status !== "CANCELLED").length <= 1 ? "An order needs at least one item. Cancel the order instead." : undefined} onClick={() => askRemove(item.id, item.name)}>Remove</button>
                      </div>
                    )}
                  </div>
                  <strong className="order-product-price">{money(item.status === "CANCELLED" ? 0 : billed ? item.linePaisa : item.estimatedLinePaisa)}</strong>
                  <span className={`order-product-status order-product-status--${itemGroup}`}>
                    <span aria-hidden="true" />
                    {STATUS_TEXT[item.status]}
                  </span>
                </article>
              );
            })}
          </div>

          <div className="order-price-breakdown">
            {fees.filter(([label, v]) => label === "Items" || v > 0).map(([label, v]) => <div key={label}><span>{label}</span><span>{money(v)}</span></div>)}
            {t.discountPaisa > 0 && <div><span>Savings on this order</span><span>{money(t.discountPaisa)}</span></div>}
            {t.couponDiscountPaisa > 0 && <div><span>Coupon</span><span>−{money(t.couponDiscountPaisa)}</span></div>}
            {t.adjustmentPaisa !== 0 && <div><span>Adjustment</span><span>{money(t.adjustmentPaisa)}</span></div>}
          </div>
          <footer className="order-products-total">
            <span>{billed ? "Order total" : "Estimated total"}</span>
            <strong>{money(billed ? t.billTotalPaisa : t.estimatedTotalPaisa)}</strong>
          </footer>
          {order.editable && <div className="order-cancel-row"><button type="button" disabled={busy} onClick={askCancel}>Cancel order</button></div>}
          {!billed && order.status !== "CANCELLED" && <p className="order-details-note order-bill-note">We bill on the actual weight of the products, so the final amount can change a little when your order is packed.</p>}
        </section>
      </div>
      {adding && (
        <AddToOrderDialog
          orderLabel={order.orderNumber}
          orderSlugs={order.items.map(i => i.slug).filter((x): x is string => !!x)}
          onClose={() => setAdding(false)}
          onAdd={(item: CartItem) => change({ add: [{ variantId: item.variantId ?? "", cuttingTypeId: item.cuttingTypeId ?? null, quantity: item.quantity, instruction: item.instruction ?? null }] })}
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
