"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import orderData from "./orderData.json";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "@/components/navbar/Navbar";
import "./MyOrders.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

type OrderStatus = "upcoming" | "complete" | "cancel" | "refund";
const orders = orderData.orders;

function getOrderItemCount(order: (typeof orders)[number]) {
  return order.products.reduce((count, product) => count + product.quantity, 0);
}

function getOrderTotal(order: (typeof orders)[number]) {
  return order.products.reduce((total, product) => total + product.quantity * product.price, 0);
}

type OrderTab = "all" | OrderStatus;

export default function MyOrdersPage() {
  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLang | null;
      if (stored === "en" || stored === "bn" || stored === "hi") {
        setCurrentLang(stored);
      }
    } catch {
      // Use fallback
    }

    const handleLanguageChange = (event: Event) => {
      const newLang = (event as CustomEvent<SupportedLang>).detail;
      if (newLang === "en" || newLang === "bn" || newLang === "hi") {
        setCurrentLang(newLang);
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const t = textMap[currentLang] || englishText;

  const money = useMemo(() => {
    return new Intl.NumberFormat(t.locale, {
      style: "currency",
      currency: t.currency,
      maximumFractionDigits: 0,
    });
  }, [t.locale, t.currency]);

  const tabs: { id: OrderTab; label: string }[] = useMemo(() => [
    { id: "all", label: t.tabAll },
    { id: "upcoming", label: t.tabUpcoming },
    { id: "complete", label: t.tabComplete },
    { id: "cancel", label: t.tabCancel },
    { id: "refund", label: t.tabRefund },
  ], [t]);

  const statusLabels: Record<OrderStatus, string> = useMemo(() => ({
    upcoming: t.statusUpcoming,
    complete: t.statusComplete,
    cancel: t.statusCancel,
    refund: t.statusRefund,
  }), [t]);

  const filteredOrders = orders.filter(order => activeTab === "all" || order.status === activeTab);

  const emptyStatusText = activeTab === "all" ? "" : (statusLabels[activeTab as OrderStatus] || activeTab);

  return (
    <main className="my-orders-page" lang={t.language}>
      <div className="my-orders-container">
        <header className="my-orders-heading">
          <span className="my-orders-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h10l3 3v18H4V3h3Z" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          </span>
          <h1>{t.heading}</h1>
        </header>

        <div className="my-orders-tabs" role="tablist" aria-label={t.tabsAria}>
          {tabs.map(tab => {
            const count = tab.id === "all"
              ? orders.length
              : orders.filter(order => order.status === tab.id).length;
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
          {filteredOrders.length ? filteredOrders.map(order => {
            const itemCount = getOrderItemCount(order);
            const statusLabel = statusLabels[order.status as OrderStatus] || order.status;
            return (
              <article className="my-order-card" key={order.id}>
                <div className="my-order-summary">
                  <div className="my-order-number">
                    <span>{t.orderId}</span>
                    <strong>{order.id}</strong>
                  </div>
                  <div className="my-order-date">
                    <span>{t.orderDate}</span>
                    <strong>{order.date}</strong>
                  </div>
                  <div className="my-order-quantity">
                    <span>{t.items}</span>
                    <strong>{itemCount} {itemCount === 1 ? t.itemSingular : t.itemPlural}</strong>
                  </div>
                  <div className="my-order-total">
                    <span>{t.orderTotal}</span>
                    <strong>{money.format(getOrderTotal(order))}</strong>
                  </div>
                  <span className={`my-order-status my-order-status--${order.status}`}>
                    <span aria-hidden="true" />
                    {statusLabel}
                  </span>
                  <Link
                    className="my-order-details-button"
                    href={`/myOrders/orderDetails?orderId=${encodeURIComponent(order.id)}`}
                  >
                    {t.viewOrder}
                  </Link>
                </div>
              </article>
            );
          }) : (
            <div className="my-orders-empty">
              <h2>{t.emptyTitle.replace("{status}", emptyStatusText).replace(/\s+/g, " ").trim()}</h2>
              <p>{t.emptySubtitle}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
