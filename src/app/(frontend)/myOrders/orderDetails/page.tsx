"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import orderData from "../orderData.json";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import {
  LANGUAGE_CHANGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  type SupportedLang,
} from "@/components/navbar/Navbar";
import "./OrderDetails.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

const orders = orderData.orders;

function getOrderItemCount(order: (typeof orders)[number]) {
  return order.products.reduce((count, product) => count + product.quantity, 0);
}

function getOrderTotal(order: (typeof orders)[number]) {
  return order.products.reduce((total, product) => total + product.quantity * product.price, 0);
}

interface OrderDetailsPageProps {
  searchParams: Promise<{ orderId?: string | string[] }>;
}

export default function OrderDetailsPage({ searchParams }: OrderDetailsPageProps) {
  const resolvedParams = use(searchParams);
  const orderId = resolvedParams.orderId;
  const selectedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const order = orders.find(item => item.id === selectedOrderId);

  if (!order) notFound();

  const [currentLang, setCurrentLang] = useState<SupportedLang>("en");

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

  const statusLabels: Record<string, string> = useMemo(() => ({
    upcoming: t.statusUpcoming,
    complete: t.statusComplete,
    cancel: t.statusCancel,
    refund: t.statusRefund,
  }), [t]);

  const deliveryStatusLabels: Record<string, string> = useMemo(() => ({
    delivered: t.deliveryDelivered,
    "on-the-way": t.deliveryOnTheWay,
    cancelled: t.deliveryCancelled,
  }), [t]);

  const paymentLabels: Record<string, string> = useMemo(() => ({
    "Paid online": t.paymentPaidOnline,
    "Cash on delivery": t.paymentCashOnDelivery,
    "Payment refunded": t.paymentRefunded,
  }), [t]);

  const deliveredProductCount = order.products.filter(product => product.deliveryStatus === "delivered").length;
  const itemCount = getOrderItemCount(order);
  const statusLabel = statusLabels[order.status] || order.status;
  const paymentLabel = paymentLabels[order.payment] || order.payment;

  return (
    <main className="order-details-page" lang={t.language}>
      <div className="order-details-container">
        <header className="order-details-heading">
          <div>
            <p>{t.headingSubtitle}</p>
            <h1>{order.id}</h1>
          </div>
          <span className={`order-details-status order-details-status--${order.status}`}>
            <span aria-hidden="true" />
            {statusLabel}
          </span>
        </header>

        <section className="order-details-card" aria-label={t.orderSummaryAria}>
          <h2>{t.orderSummaryHeading}</h2>
          <dl>
            <div><dt>{t.orderDate}</dt><dd>{order.date}</dd></div>
            <div><dt>{t.items}</dt><dd>{itemCount} {itemCount === 1 ? t.itemSingular : t.itemPlural}</dd></div>
            <div><dt>{t.orderTotal}</dt><dd>{money.format(getOrderTotal(order))}</dd></div>
            <div><dt>{t.payment}</dt><dd>{paymentLabel}</dd></div>
            <div><dt>{t.deliveryAddress}</dt><dd>{order.deliveryAddress}</dd></div>
          </dl>
        </section>

        <section className="order-products-card" aria-labelledby="order-products-heading">
          <div className="order-products-heading">
            <div>
              <h2 id="order-products-heading">{t.productsHeading}</h2>
              <p>{t.productsDelivered.replace("{delivered}", String(deliveredProductCount)).replace("{total}", String(order.products.length))}</p>
            </div>
            <span>{order.products.length} {order.products.length === 1 ? t.productSingular : t.productPlural}</span>
          </div>

          <div className="order-products-list">
            {order.products.map(product => {
              const deliveryLabel = deliveryStatusLabels[product.deliveryStatus] || product.deliveryStatus.replace("-", " ");
              return (
                <article className="order-product-row" key={product.id}>
                  <div className="order-product-image">
                    <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 72px, 88px" />
                  </div>
                  <div className="order-product-copy">
                    <h3>{product.name}</h3>
                    <p>{t.qty} {product.quantity} <span>·</span> {product.unit}</p>
                  </div>
                  <strong className="order-product-price">{money.format(product.quantity * product.price)}</strong>
                  <span className={`order-product-status order-product-status--${product.deliveryStatus}`}>
                    <span aria-hidden="true" />
                    {deliveryLabel}
                  </span>
                </article>
              );
            })}
          </div>

          <footer className="order-products-total">
            <span>{t.orderTotal}</span>
            <strong>{money.format(getOrderTotal(order))}</strong>
          </footer>
        </section>
      </div>
    </main>
  );
}
