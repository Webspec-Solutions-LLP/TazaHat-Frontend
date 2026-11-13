"use client";

import RequireLogin from "@/components/auth/RequireLogin";

import { useEffect, useRef, useState } from "react";
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
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./OrderDetails.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

type Item = MyOrderDetail["items"][number];
const money = (paisa: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paisa / 100);
const when = (iso: string, withTime = false) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: "Asia/Kolkata" });

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
  const [lang] = useLanguage();
  const text = textMap[lang] || englishText;

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
  // the shop changed this order: show it at once (if a dialog is open, when it closes)
  const dialogOpen = panel || adding || !!editing || !!cancelling;
  const waitingChange = useRef(false);
  const dialogRef = useRef(dialogOpen); dialogRef.current = dialogOpen;
  useEffect(() => {
    const again = (e: Event) => {
      const d = (e as CustomEvent<{ id?: string; number?: string }>).detail;
      if (d?.id !== reference && d?.number !== reference && d?.id !== order?.id) return;
      if (dialogRef.current) waitingChange.current = true; else void refresh();
    };
    window.addEventListener("tazahat:order-changed", again);
    return () => window.removeEventListener("tazahat:order-changed", again);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, order?.id]);
  useEffect(() => { if (!dialogOpen && waitingChange.current) { waitingChange.current = false; void refresh(); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);
  /** one change to the order; the server prices the whole order again, then the page shows the new state */
  const change = async (edit: OrderEditInput, done?: string): Promise<string | null> => {
    setBusy(true);
    const res = await editOrderAction(reference, edit);
    if (res.ok) { await refresh(); if (done) setNotice({ text: done, tone: "ok" }); } else setNotice({ text: res.error, tone: "bad" });
    setBusy(false);
    return res.ok ? null : res.error;
  };

  const getPaymentText = (method: string) => {
    if (method === "COD") return text.paymentCashOnDelivery;
    if (method === "ONLINE") return text.paymentOnline;
    if (method === "UNKNOWN") return "—";
    return method;
  };

  /** cancel an item (or the whole order when `item` is null): once the shop has started, say it is only a request first */
  const startCancel = (item: Item | null) => {
    if (order?.cancelMode === "request") {
      setDialog({ title: text.confirmationAlertTitle, icon: "warning", body: <p>{text.lateCancelWarning}</p>, buttons: [{ label: text.ok, tone: "primary", onClick: () => setCancelling({ item }) }] });
    } else setCancelling({ item });
  };
  /** the reason was chosen: ask once more before it is sent ("Are you sure?"), then cancel */
  const submitCancel = (reason: string, details: string): Promise<string | null> => new Promise(resolve => {
    const target = cancelling?.item ?? null;
    const what = target ? `“${target.name}”` : `${text.orderWord} ${order?.orderNumber ?? ""}`;
    const request = order?.cancelMode === "request";
    setDialog({
      title: request ? text.sendCancelRequestTitle : (target ? text.cancelThisItemTitle : text.cancelThisOrderTitle), icon: "warning",
      body: <><p>{request ? text.cancelRequestReviewBody.replace("{what}", what) : (target ? text.cancelItemBody.replace("{what}", what) : text.cancelOrderBody.replace("{what}", what))}</p><p><b>{text.reason}:</b> {reason}{details ? ` - ${details}` : ""}</p></>,
      buttons: [
        { label: request ? text.yesSendRequest : text.yesCancel, tone: "danger", onClick: async () => {
          const res = target ? await cancelOrderItemAction(reference, target.id, reason, details) : await cancelOrderAction(reference, reason, details);
          if (!res.ok) return resolve(res.error);
          setCancelling(null);
          await refresh();
          setNotice({ text: res.requested ? text.cancelRequestSent : target ? text.itemCancelledNotice.replace("{name}", target.name) : text.orderCancelledNotice, tone: "ok" });
          resolve(null);
        } },
        { label: text.noKeepIt, tone: "plain", onClick: () => resolve("") },
      ],
    });
  });

  if (order === undefined) return <main className="order-details-page"><div className="order-details-container"><OrderDetailsSkeleton /></div></main>;
  if (order === null) {
    return (
      <main className="order-details-page"><div className="order-details-container">
        <div className="order-details-card"><h2>{text.orderNotFoundTitle}</h2><p className="order-details-note">{text.orderNotFoundNote}</p><Link className="order-details-back" href="/orders">{text.backToMyOrders}</Link></div>
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
    { label: text.rowItems, est: estimatedItems, fin: finalItems },
    { label: text.rowDressing, est: t.cuttingFeePaisa, fin: t.cuttingFeePaisa },
    { label: text.rowDelivery, est: t.deliveryFeePaisa, fin: t.deliveryFeePaisa },
    { label: text.rowConvenience, est: t.convenienceFeePaisa, fin: t.convenienceFeePaisa },
    { label: text.rowProcessing, est: t.deliveryTimeFeePaisa, fin: t.deliveryTimeFeePaisa },
    { label: text.rowCoupon, est: -t.couponDiscountPaisa, fin: 0 },
    { label: text.rowAdjustment, est: 0, fin: t.adjustmentPaisa },
    { label: text.rowDiscount, est: 0, fin: -t.discountPaisa },
    { label: text.rowWaived, est: Math.abs(estOther) >= 1 ? estOther : 0, fin: Math.abs(finalOther) >= 1 ? finalOther : 0 },
  ].filter(r => r.est !== 0 || (billed && r.fin !== 0));
  const places = pickup ? (order.store ? `${order.store.name}${order.store.areaName ? `, ${order.store.areaName}` : ""}${order.store.pincode ? `, ${order.store.pincode}` : ""}` : text.ourStore) : lines.join(" · ") || "—";

  return (
    <main className="order-details-page">
      <div className="order-details-container">
        <header className="order-details-heading">
          <div className="order-details-heading-title">
            <div className="order-details-heading-meta">
              <p>{text.headingSubtitle}</p>
              <span className={`order-details-status order-details-status--${group}`}>
                <span aria-hidden="true" />
                {STATUS_TEXT[order.status]}
              </span>
            </div>
            <div className="order-details-heading-main">
              <h1>{order.orderNumber}</h1>
              {order.status !== "CANCELLED" && <a className="order-invoice-btn" href={`/api/invoice/${encodeURIComponent(order.orderNumber)}?format=thermal&lang=${lang}&download=1`}>{text.invoiceBtn}</a>}
              {order.cancelMode && (
                <span className="order-edit-buttons">
                  {order.editable && <button type="button" disabled={busy} onClick={() => setPanel(true)}>{text.editOrderBtn}</button>}
                  {order.editable && <button type="button" className="is-light" disabled={busy} onClick={() => setAdding(true)}>{text.addItemsBtn}</button>}
                  <button type="button" className="is-danger" disabled={busy} onClick={() => startCancel(null)}>{text.cancelOrderBtn}</button>
                </span>
              )}
            </div>
          </div>
        </header>

        {notice && <p className={`order-edit-notice is-${notice.tone}`} role="status">{notice.text}</p>}
        {order.cancelReason && order.status === "CANCELLED" && <p className="order-edit-notice is-bad">{text.cancelledPrefix} {order.cancelReason}</p>}
        {order.cancelMode && <p className="order-edit-hint">{order.editable ? text.editableHint : text.processingHint}</p>}

        <div className="order-layout">
          <aside className="order-side">
            <section className="order-details-card order-summary" aria-label={text.orderSummaryAria}>
              <h2>{text.orderSummaryHeading}</h2>
              <dl>
                <div><dt>{text.placed}</dt><dd>{when(order.placedAt, true)}</dd></div>
                <div><dt>{pickup ? text.pickup : text.delivery}</dt><dd>{order.deliveryDate ? when(order.deliveryDate) : "—"}{order.deliverySlotLabel ? ` · ${order.deliverySlotLabel.replace(/\s+/g, " ")}` : order.deliverySlotName ? ` · ${order.deliverySlotName}` : ""}</dd></div>
                <div><dt>{text.payment}</dt><dd>{getPaymentText(order.paymentMethod)}{order.paymentState === "PAID" ? ` · ${text.paymentPaid}` : order.paymentState === "PARTIAL" ? ` · ${text.paymentPartPaid}` : ""}</dd></div>
                <div><dt>{text.items}</dt><dd>{active.length} {active.length === 1 ? text.itemSingular : text.itemPlural}</dd></div>
                <div className="is-wide"><dt>{pickup ? text.pickupStore : text.address}</dt><dd>{places}</dd></div>
              </dl>
            </section>

            <section className="order-details-card order-amounts" aria-label={text.amountsCardAria}>
              <table>
                <thead><tr><th scope="col">{text.colAmount}</th><th scope="col">{text.colEstimated}</th><th scope="col">{text.colFinal}</th></tr></thead>
                <tbody>
                  {amountRows.map(r => <tr key={r.label}><th scope="row">{r.label}</th><td>{money(r.est)}</td><td>{billed ? money(r.fin) : <span className="order-wait">—</span>}</td></tr>)}
                </tbody>
                <tfoot>
                  <tr className="is-total"><th scope="row">{text.rowTotal}</th><td>{money(t.estimatedTotalPaisa)}</td><td>{billed ? money(t.billTotalPaisa) : <span className="order-wait">{text.afterPackingWait}</span>}</td></tr>
                  {billed && <tr><th scope="row">{text.rowPaid}</th><td /><td>{money(order.paidPaisa)}</td></tr>}
                  {billed && <tr><th scope="row">{text.rowDue}</th><td /><td>{money(due)}</td></tr>}
                </tfoot>
              </table>
              {(t.discountPaisa + (t.savedPaisa ?? 0)) > 0 && <p className="order-amount-saved">{text.savedOnOrder.replace("{amount}", money(t.discountPaisa + (t.savedPaisa ?? 0)))}</p>}
              {!billed && order.status !== "CANCELLED" && <p className="order-amount-wait">{text.finalBillWaitNote}</p>}
            </section>
          </aside>

          <section className="order-products-card" aria-labelledby="order-products-heading">
            <div className="order-products-heading">
              <div>
                <h2 id="order-products-heading">{text.productsHeading}</h2>
                <p>{text.productsDelivered.replace("{delivered}", String(delivered)).replace("{total}", String(order.items.length))}</p>
              </div>
              <span>{order.items.length} {order.items.length === 1 ? text.productSingular : text.productPlural}</span>
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
                        {text.qty} {item.quantity}
                        {item.packLabel ? <><span>·</span>{item.packLabel}</> : item.weight && item.orderedMeasurement ? <><span>·</span>{item.orderedMeasurement} {text.gm}</> : null}
                        {item.dressing ? <><span>·</span>{item.dressing}</> : null}
                        {item.instruction ? <><span>·</span>“{item.instruction}”</> : null}
                      </p>
                      {item.cancelNote && (item.status === "CANCELLED" || item.cancelStatus !== "NONE") && <p className="order-item-reason">{item.status === "CANCELLED" ? text.cancelled : item.cancelStatus === "REJECTED" ? text.cancellationNotAccepted : text.cancellationRequested}: {item.cancelNote}</p>}
                      {(item.canEdit || item.canCancel) && (
                        <div className="order-item-edit" role="group" aria-label={text.changeItemAria.replace("{name}", item.name)}>
                          {item.canEdit && <button type="button" disabled={busy} onClick={() => setEditing(item)}>{text.edit}</button>}
                          {item.canCancel && <button type="button" className="order-item-remove" disabled={busy} onClick={() => startCancel(item)}>{text.cancel}</button>}
                        </div>
                      )}
                    </div>
                    <div className="order-product-amounts">
                      <span className="order-product-est"><small>{text.est}</small> {money(item.status === "CANCELLED" ? 0 : item.estimatedLinePaisa)}</span>
                      {item.status !== "CANCELLED" && (item.finalLinePaisa !== null
                        ? <span className="order-product-final"><small>{text.final}{weighed ? ` · ${item.billedMeasurement} ${text.gm}` : ""}</small> {money(item.finalLinePaisa)}</span>
                        : <span className="order-product-final-wait">{text.finalAfterPackingWait}</span>)}
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
          onSave={async change_ => change({ update: [{ itemId: editing.id, variantId: change_.variantId, cuttingTypeId: change_.cuttingTypeId, quantity: change_.quantity, instruction: change_.instruction }] }, text.itemUpdatedNotice.replace("{name}", editing.name))}
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
          title={cancelling.item ? text.cancelItemDialogTitle : text.cancelOrderDialogTitle}
          subject={cancelling.item ? cancelling.item.name : `${text.orderPrefix} ${order.orderNumber}`}
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
  const [lang] = useLanguage();
  const text = textMap[lang] || englishText;
  return <RequireLogin what={text.requireLoginWhat}><OrderDetailsInner /></RequireLogin>;
}
