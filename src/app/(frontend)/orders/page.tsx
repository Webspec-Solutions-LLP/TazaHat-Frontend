"use client";

import RequireLogin from "@/components/auth/RequireLogin";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { STATUS_TEXT, statusGroup } from "@/lib/orderStatus";
import { myOrderCountsAction, myOrdersAction, type MyOrder } from "@/app/checkout-actions";
import { OrderCardsSkeleton } from "@/components/skeleton/Skeletons";
import "./MyOrders.css";

type OrderStatus = "upcoming" | "complete" | "cancel" | "refund";
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const tabOf = (o: MyOrder): OrderStatus => statusGroup(o.status);
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
  const [counts, setCounts] = useState<Record<OrderTab, number> | null>(null);
  const asked = useRef(0);
  // a tab (and its first 30 orders) is asked from the server: the tab counts and the list are the customer's real orders
  const load = useCallback(async (next: number, tab: OrderTab) => {
    const ticket = ++asked.current;
    // nothing is refunded yet: that tab is simply empty
    if (tab === "refund") { setTotal(0); setPage(1); setOrders([]); return; }
    const res = await myOrdersAction(next, tab);
    if (ticket !== asked.current) return;
    if (!res) { setOrders(current => current ?? []); return; }
    setTotal(res.total);
    setPage(res.page);
    setOrders(current => (next === 1 ? res.orders : [...(current ?? []), ...res.orders]));
  }, []);
  useEffect(() => { setOrders(null); void load(1, activeTab); }, [load, activeTab]);
  useEffect(() => { myOrderCountsAction().then(c => c && setCounts(c)); }, []);
  // the shop changed one of these orders (or one was placed): the loaded pages are read again in place, without a refresh
  const pageNow = useRef(page); pageNow.current = page;
  useEffect(() => {
    const again = async () => {
      if (activeTab === "refund") return;
      const ticket = ++asked.current;
      const all: MyOrder[] = [];
      let last: Awaited<ReturnType<typeof myOrdersAction>> = null;
      for (let p = 1; p <= pageNow.current; p++) {
        last = await myOrdersAction(p, activeTab);
        if (!last || ticket !== asked.current) return;
        all.push(...last.orders);
      }
      if (!last) return;
      setOrders(all); setTotal(last.total);
      void myOrderCountsAction().then(c => c && setCounts(c));
    };
    window.addEventListener("tazahat:order-changed", again);
    return () => window.removeEventListener("tazahat:order-changed", again);
  }, [activeTab]);
  const list = orders ?? [];
  const filteredOrders = list;
  // the next 30 orders load by themselves when the end of the list comes into view
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const hasMore = orders !== null && orders.length < total;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const watcher = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting || busy.current) return;
      busy.current = true;
      setLoadingMore(true);
      await load(page + 1, activeTab);
      setLoadingMore(false);
      busy.current = false;
    }, { rootMargin: "300px" });
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [hasMore, page, load, activeTab]);
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
            const count = counts ? counts[tab.id] : null;
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
                <span>{count ?? "–"}</span>
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
          {orders === null ? <OrderCardsSkeleton count={4} /> : filteredOrders.length ? filteredOrders.map(order => (
            <article className="my-order-card" key={order.id}>
              <Link className="my-order-card-link" href={`/orders/${encodeURIComponent(order.orderNumber)}`} aria-label={`View order ${order.orderNumber}`} />
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
                <span className="my-order-details-button">View order</span>
              </div>
              <ul className="my-order-items" aria-label="Items in this order">
                {order.preview.map((item, index) => (
                  <li key={index}>
                    <span className="my-order-item-image">{item.image && <Image src={item.image} alt="" fill sizes="32px" unoptimized={isRemoteImage(item.image)} onError={fallbackImage} />}</span>
                    <span className="my-order-item-name">{item.name}</span>
                    <span className="my-order-item-qty">{[item.pack, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
                {order.totalItem > order.preview.length && <li className="my-order-items-more">+{order.totalItem - order.preview.length} more</li>}
              </ul>
            </article>
          )) : (
            <div className="my-orders-empty">
              <h2>No {activeTab === "all" ? "" : `${activeTab} `}orders yet</h2>
              <p>Your orders in this category will show up here.</p>
            </div>
          )}
          {hasMore && <div ref={sentinel} className="my-orders-more">{loadingMore ? <OrderCardsSkeleton count={2} label="Loading more orders" /> : null}</div>}
        </section>
      </div>
    </main>
  );
}

/** Needs a login: without one the page asks the visitor to log in. */
export default function MyOrdersPage() {
  return <RequireLogin what="your orders"><MyOrdersContent /></RequireLogin>;
}
