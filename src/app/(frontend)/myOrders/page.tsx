"use client";

import RequireLogin from "@/components/auth/RequireLogin";

import { useCallback, useEffect, useState } from "react";
import { myOrdersAction, type MyOrder } from "@/app/checkout-actions";
import "./MyOrders.css";

type OrderStatus = "upcoming" | "complete" | "cancel" | "refund";
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const tabOf = (o: MyOrder): OrderStatus => (o.status === "DELIVERED" ? "complete" : o.status === "CANCELLED" ? "cancel" : "upcoming");
const STATUS_TEXT: Record<MyOrder["status"], string> = { PENDING: "Order placed", IN_PROGRESS: "In progress", PROCESSING: "Processing", PACKAGING: "Packing", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled" };
const dateText = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

type OrderTab = "all" | OrderStatus;

const tabs: { id: OrderTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "complete", label: "Complete" },
  { id: "cancel", label: "Cancel" },
  { id: "refund", label: "Refund" },
];

function MyOrdersContent() {
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const load = useCallback(async (next: number) => {
    const res = await myOrdersAction(next);
    if (!res) { setOrders(current => current ?? []); return; }
    setTotal(res.total);
    setPage(res.page);
    setOrders(current => (next === 1 ? res.orders : [...(current ?? []), ...res.orders]));
  }, []);
  useEffect(() => { void load(1); }, [load]);
  // a message left by the page we came from (the order was placed)
  const [flash, setFlash] = useState("");
  useEffect(() => {
    try {
      const text = window.sessionStorage.getItem("tazahat-flash");
      if (!text) return;
      window.sessionStorage.removeItem("tazahat-flash");
      setFlash(text);
      const t = window.setTimeout(() => setFlash(""), 4500);
      return () => window.clearTimeout(t);
    } catch { /* no storage: no message */ }
  }, []);
  const list = orders ?? [];
  const filteredOrders = list.filter(order => activeTab === "all" || tabOf(order) === activeTab);

  return (
    <main className="my-orders-page">
      {flash && <div className="my-orders-flash" role="status">{flash}</div>}
      <div className="my-orders-container">
        <header className="my-orders-heading">
          <span className="my-orders-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h10l3 3v18H4V3h3Z" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          </span>
          <h1>My Orders</h1>
        </header>

        <div className="my-orders-tabs" role="tablist" aria-label="Filter orders by status">
          {tabs.map(tab => {
            const count = tab.id === "all" ? list.length : list.filter(order => tabOf(order) === tab.id).length;
            return (
              <button
                className="my-orders-tab"
                id={`orders-tab-${tab.id}`}
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="orders-panel"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <section
          className="my-orders-list"
          id="orders-panel"
          role="tabpanel"
          aria-labelledby={`orders-tab-${activeTab}`}
          aria-live="polite"
        >
          {orders === null ? <div className="my-orders-empty"><p>Loading your orders…</p></div> : filteredOrders.length ? filteredOrders.map(order => (
            <article className="my-order-card" key={order.id}>
              <div className="my-order-summary">
                <div className="my-order-number">
                  <span>Order ID</span>
                  <strong>{order.orderNumber}</strong>
                </div>
                <div className="my-order-date">
                  <span>Order date</span>
                  <strong>{dateText(order.placedAt)}</strong>
                </div>
                <div className="my-order-quantity">
                  <span>{order.deliveryType === "STORE_PICKUP" ? "Pickup" : "Delivery"}</span>
                  <strong>{dateText(order.deliveryDate)}</strong>
                </div>
                <div className="my-order-total">
                  <span>Order total</span>
                  <strong>{money.format((order.billTotalPaisa || order.estimatedTotalPaisa) / 100)}</strong>
                </div>
                <span className={`my-order-status my-order-status--${tabOf(order)}`}>
                  <span aria-hidden="true" />
                  {STATUS_TEXT[order.status]}
                </span>
              </div>
              <p className="my-order-items-line">{order.totalItem} {order.totalItem === 1 ? "item" : "items"}: {order.preview.map(p => p.name).join(", ")}{order.totalItem > order.preview.length ? "…" : ""}</p>
            </article>
          )) : (
            <div className="my-orders-empty">
              <h2>No {activeTab === "all" ? "" : `${activeTab} `}orders yet</h2>
              <p>Your orders in this category will show up here.</p>
            </div>
          )}
          {orders !== null && list.length < total && (
            <button type="button" className="my-orders-more" disabled={loadingMore} onClick={async () => { setLoadingMore(true); await load(page + 1); setLoadingMore(false); }}>{loadingMore ? "Loading…" : "Load more orders"}</button>
          )}
        </section>
      </div>
    </main>
  );
}

/** Needs a login: without one the page asks the visitor to log in. */
export default function MyOrdersPage() {
  return <RequireLogin what="your orders"><MyOrdersContent /></RequireLogin>;
}
