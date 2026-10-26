"use client";

import Link from "next/link";
import { useState } from "react";
import orderData from "./orderData.json";
import "./MyOrders.css";

type OrderStatus = "upcoming" | "complete" | "cancel" | "refund";
const orders = orderData.orders;
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getOrderItemCount(order: (typeof orders)[number]) {
  return order.products.reduce((count, product) => count + product.quantity, 0);
}

function getOrderTotal(order: (typeof orders)[number]) {
  return order.products.reduce((total, product) => total + product.quantity * product.price, 0);
}

type OrderTab = "all" | OrderStatus;

const tabs: { id: OrderTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "complete", label: "Complete" },
  { id: "cancel", label: "Cancel" },
  { id: "refund", label: "Refund" },
];

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const filteredOrders = orders.filter(order => activeTab === "all" || order.status === activeTab);

  return (
    <main className="my-orders-page">
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
            return (
              <article className="my-order-card" key={order.id}>
                <div className="my-order-summary">
                  <div className="my-order-number">
                    <span>Order ID</span>
                    <strong>{order.id}</strong>
                  </div>
                  <div className="my-order-date">
                    <span>Order date</span>
                    <strong>{order.date}</strong>
                  </div>
                  <div className="my-order-quantity">
                    <span>Items</span>
                    <strong>{getOrderItemCount(order)} {getOrderItemCount(order) === 1 ? "item" : "items"}</strong>
                  </div>
                  <div className="my-order-total">
                    <span>Order total</span>
                    <strong>{money.format(getOrderTotal(order))}</strong>
                  </div>
                  <span className={`my-order-status my-order-status--${order.status}`}>
                    <span aria-hidden="true" />
                    {order.status}
                  </span>
                  <Link
                    className="my-order-details-button"
                    href={`/myOrders/orderDetails?orderId=${encodeURIComponent(order.id)}`}
                  >
                    View order
                  </Link>
                </div>
              </article>
            );
          }) : (
            <div className="my-orders-empty">
              <h2>No {activeTab} orders yet</h2>
              <p>Your orders in this category will show up here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
