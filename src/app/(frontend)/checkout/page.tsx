"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Address, { type AddressFormValues } from "@/components/modals/address/Address";
import "./Checkout.css";

const days = [
  { month: "October", date: 23, day: "Friday" },
  { month: "October", date: 24, day: "Saturday" },
  { month: "October", date: 25, day: "Sunday" },
  { month: "October", date: 26, day: "Monday" },
  { month: "October", date: 27, day: "Tuesday" },
  { month: "October", date: 28, day: "Wednesday" },
];

const schedules = [
  { title: "Morning Delivery", detail: "Between 10:00AM - 12:00PM", fee: 0 },
  { title: "Lunch Delivery", detail: "Between 12:00PM - 2:00PM", fee: 0 },
  { title: "Express Delivery", detail: "Before 9:00 AM", fee: 20 },
  { title: "Rocket Service", detail: "Before 8:00 AM", fee: 28 },
  { title: "Priority Delivery", detail: "Before 10:00AM", fee: 10 },
  { title: "Evening Delivery", detail: "Between 6:00PM - 10:00PM", fee: 0 },
];

type CheckoutItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  weight?: string;
};

const demoAddresses = [
  "Office : C/O Tapash Nath, Dharmanagar, near school, Cooch Behar, West Bengal 73610",
  "Home : House 14, Road 3, Banamalipur, Agartala, Tripura 799001",
  "Flat 3B, Sunshine Residency, Ramnagar, Agartala, Tripura 799002",
];

function Icon({ name }: { name: string }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, React.ReactNode> = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></>,
    truck: <><path d="M2 6h12v11H2zM14 10h4l4 4v3h-8z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    card: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 15h5"/></>,
    receipt: <><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></>,
    drop: <><path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/></>,
    shield: <><path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    tag: <><path d="m20 13-7 7-10-10V3h7l10 10Z"/><circle cx="7.5" cy="7.5" r="1"/></>,
  };
  return <svg {...common}>{paths[name] ?? paths.box}</svg>;
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [deliveryType, setDeliveryType] = useState("Store Pick Up");
  const [schedule, setSchedule] = useState(0);
  const [payment, setPayment] = useState("Online Payment");
  const [address, setAddress] = useState(demoAddresses[0]);
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [placed, setPlaced] = useState(false);
  const deliveryFee = deliveryType === "Home Delivery" ? 0 : 0;
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = subtotal + deliveryFee + schedules[schedule].fee;

  const saveAddress = (values: AddressFormValues) => {
    setAddress([values.recipient, values.houseNumber, values.addressLine1, values.addressLine2, values.locality, values.landmark, values.pincode].filter(Boolean).join(", "));
    setIsAddressModalOpen(false);
  };

  useEffect(() => {
    const savedItems = window.sessionStorage.getItem("tazahat-checkout-items");
    if (!savedItems) return;
    try {
      const parsedItems: unknown = JSON.parse(savedItems);
      if (Array.isArray(parsedItems)) setItems(parsedItems as CheckoutItem[]);
    } catch {
      window.sessionStorage.removeItem("tazahat-checkout-items");
    }
    window.sessionStorage.removeItem("tazahat-checkout-items");
  }, []);

  const applyCoupon = () => setCouponMessage(coupon.trim() ? "This coupon code is not valid." : "Enter a coupon code to apply.");

  return (
    <main className="checkout-page">
      <div className="checkout-layout">
        <div className="checkout-left-scroll">
          <section className="checkout-section checkout-products">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="box" /></span><div><h2>Your Items <b>*</b></h2><p>{itemCount} {itemCount === 1 ? "item" : "items"} in your order</p></div></div>
            {items.length > 0 ? <div className="checkout-product-list">{items.map(item => <article className="checkout-product" key={item.id}>
              <div className="checkout-product-image"><Image src={item.image} alt={item.name} fill sizes="76px"/></div>
              <div className="checkout-product-info"><h3>{item.name}</h3>{item.weight && <p>{item.weight}</p>}<span>Qty: {item.quantity}</span></div>
              <strong className="checkout-product-price">₹{(item.price * item.quantity).toFixed(2)}</strong>
            </article>)}</div> : <p className="checkout-empty-items">No cart items were found. Add items to your cart to continue.</p>}
          </section>
          <section className="checkout-section checkout-address">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="pin" /></span><div><h1>Delivery Address <b>*</b></h1><p>Select your delivery address or add a new one</p></div></div>
            <button className="checkout-add-address" type="button" onClick={() => setIsAddressModalOpen(true)}><span>＋</span> Add Address</button>
            <button className={`checkout-address-choice${isAddressListOpen ? " is-open" : ""}`} type="button" aria-expanded={isAddressListOpen} onClick={() => setIsAddressListOpen(open => !open)}><span className="checkout-radio checked"/><span className="checkout-home-icon">⌂</span><strong>{address}</strong><span className="checkout-chevron" aria-hidden="true"/></button>
            {isAddressListOpen && <div className="checkout-address-list" role="listbox" aria-label="Saved delivery addresses">{demoAddresses.map((savedAddress) => <button key={savedAddress} type="button" role="option" aria-selected={address === savedAddress} className={`checkout-address-option${address === savedAddress ? " selected" : ""}`} onClick={() => { setAddress(savedAddress); setIsAddressListOpen(false); }}><span className={`checkout-radio${address === savedAddress ? " checked" : ""}`}/><span>{savedAddress}</span></button>)}</div>}
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="calendar" /></span><div><h2>Delivery Date <b>*</b></h2><p>Choose your preferred delivery date</p></div></div>
            <div className="checkout-date-grid">{days.map((day, index) => <button key={day.date} type="button" className={`checkout-date${selectedDay === index ? " selected" : ""}`} onClick={() => setSelectedDay(index)}><span>{day.month}</span><strong>{day.date}</strong><b>{day.day}</b>{selectedDay === index && <i>✓</i>}</button>)}</div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="truck" /></span><div><h2>Delivery Type <b>*</b></h2><p>Choose your delivery type</p></div></div>
            <div className="checkout-options checkout-type-options">{["Store Pick Up", "Home Delivery"].map((option, index) => <button type="button" key={option} className={`checkout-choice${deliveryType === option ? " selected" : ""}`} onClick={() => setDeliveryType(option)}><span className={`checkout-radio${deliveryType === option ? " checked" : ""}`}/><span className="checkout-choice-icon">{index === 0 ? "▣" : "⌂"}</span><strong>{option}</strong></button>)}</div>
            <span className="checkout-wave" aria-hidden="true">〜〜</span>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="clock" /></span><div><h2>Delivery Schedule <b>*</b></h2><p>Select your preferred delivery time</p></div></div>
            <div className="checkout-schedule-grid">{schedules.map((item, index) => <label key={item.title} className={`checkout-schedule${schedule === index ? " selected" : ""}`}><input type="radio" name="schedule" checked={schedule === index} onChange={() => setSchedule(index)}/><span className="checkout-radio checked"/><span><strong>{item.title}</strong> <small>({item.detail})</small>{item.fee > 0 && <b className="schedule-fee"> +₹{item.fee}.00</b>}</span></label>)}</div>
          </section>

          <section className="checkout-section checkout-payment-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="card" /></span><div><h2>Payment Option <b>*</b></h2><p>Select your preferred payment method</p></div></div>
            <div className="checkout-options checkout-payment-options">{["Online Payment", "Cash On Delivery"].map((option, index) => <button type="button" key={option} className={`checkout-choice${payment === option ? " selected" : ""}`} onClick={() => setPayment(option)}><span className={`checkout-radio${payment === option ? " checked" : ""}`}/><span className="checkout-choice-icon">{index === 0 ? "▰" : "♧"}</span><strong>{option}</strong></button>)}</div>
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-heading"><span className="checkout-summary-icon"><Icon name="receipt" /></span><div><h2>Estimated Price Details</h2><p>Review your order details and apply coupon code</p></div></div>
          <form className="checkout-coupon" onSubmit={event => { event.preventDefault(); applyCoupon(); }}><span>♧</span><input aria-label="Coupon code" value={coupon} onChange={event => setCoupon(event.target.value)} placeholder="Enter coupon code"/><button type="submit">Apply</button></form>
          {couponMessage && <p className="checkout-coupon-message" role="status">{couponMessage}</p>}
          <p className="checkout-note"><span>i</span><span>Please note we bill based on the actual wt. of the products. Final amount may vary depending on the actual item wt. during packaging. Thank you.</span></p>
          <div className="checkout-price-rows">
            <div className="checkout-price-row"><Icon name="box"/><span>Total {itemCount} {itemCount === 1 ? "Item" : "Items"}</span><strong>₹{subtotal.toFixed(2)}</strong></div>
            <div className="checkout-price-row"><Icon name="drop"/><span>Dressing Fee</span><b>₹0.00</b></div>
            <div className="checkout-price-row"><Icon name="truck"/><span>Delivery Fee</span><b>₹{deliveryFee.toFixed(2)}</b></div>
            <div className="checkout-price-row"><Icon name="shield"/><span>Convenience Fee</span><b>₹0.00</b></div>
            <div className="checkout-price-row"><span className="checkout-lightning">ϟ</span><span>Fast Processing Charge</span><b>₹{schedules[schedule].fee.toFixed(2)}</b></div>
            <div className="checkout-price-row"><Icon name="tag"/><span>Promo</span><b>₹0.00</b></div>
          </div>
          <div className="checkout-total"><span>₹</span><strong>Total Amount</strong><b>₹{total.toFixed(2)}</b></div>
          <button type="button" className="checkout-proceed" onClick={() => setPlaced(true)}><span>🛒</span>{placed ? "ORDER READY" : "PROCEED TO CHECKOUT"}<span>›</span></button>
          {placed && <p className="checkout-order-message" role="status">Your order details are ready. Payment: {payment}.</p>}
          <div className="checkout-promo-art"><div className="checkout-promo-copy">Fresh<br/>From River<br/>To Your Table</div><Image src="/images/products/product--2.png" alt="Fresh fish" fill sizes="(max-width: 800px) 40vw, 300px"/></div>
        </aside>
      </div>
      {isAddressModalOpen && <Address onClose={() => setIsAddressModalOpen(false)} onSave={saveAddress} />}
    </main>
  );
}
