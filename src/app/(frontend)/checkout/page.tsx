"use client";

import RequireLogin from "@/components/auth/RequireLogin";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CheckoutDialog, { type DialogSpec } from "@/components/checkout/CheckoutDialog";
import Address, { type AddressFormValues } from "@/components/modals/address/Address";
import { listAddressesAction, saveAddressAction, type SavedAddress } from "@/app/address-actions";
import { checkoutOptionsAction, checkoutQuoteAction, placeOrderAction, type CheckoutOptions, type CheckoutPopup, type CheckoutQuote } from "@/app/checkout-actions";
import type { CartItem } from "@/components/modals/cart/Cart";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import "./Checkout.css";

const CART_STORAGE_KEY = "tazahat-cart-v1";
const money = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;
/** the address as one line; the city comes last, in bold */
function AddressLine({ a }: { a: SavedAddress }) {
  const text = [a.contactName, a.apartmentNumber, a.line1, a.line2, a.landmark, a.locality, a.pincode].filter(Boolean).join(", ");
  return <>{a.label ? `${a.label} : ` : ""}{text}{a.cityName && <>, <b className="checkout-address-city">{a.cityName}</b></>}</>;
}
const toFormValues = (a: SavedAddress): AddressFormValues => ({
  addressType: a.label ?? "", recipient: a.contactName, phone: a.phone, alternatePhone: a.altPhone ?? "", locality: a.locality ?? "", addressLine1: a.line1,
  addressLine2: a.line2 ?? "", houseNumber: a.apartmentNumber ?? "", landmark: a.landmark ?? "", pincode: a.pincode ?? "",
});
const dayParts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return { month: d.toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" }), date: d.getUTCDate(), day: d.toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" }) };
};
const readCart = (): CartItem[] => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((i: CartItem) => i && typeof i.id === "string" && i.variantId && i.quantity > 0) : [];
  } catch { return []; }
};

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

/** the cart is the browser's: write it and tell the header (same tab) to read it again */
const writeCart = (items: CartItem[]) => {
  try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch { /* private mode */ }
  window.dispatchEvent(new StorageEvent("storage", { key: CART_STORAGE_KEY }));
};
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "long", timeZone: "UTC" });

function CheckoutContent() {
  const router = useRouter();
  const [toast, setToast] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeId, setStoreId] = useState("");
  const showToast = useCallback((text: string, tone: "error" | "success" = "error") => setToast({ text, tone }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const [cart, setCart] = useState<CartItem[] | null>(null);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"HOME_DELIVERY" | "STORE_PICKUP">("HOME_DELIVERY");
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [payment, setPayment] = useState<"COD" | "ONLINE">("COD");
  const [addressId, setAddressId] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  // the cart is the browser's own (the same one the cart sidebar shows); the address book and the city's choices come from the server
  useEffect(() => {
    setCart(readCart());
    checkoutOptionsAction().then(o => {
      setOptions(o);
      if (o) {
        setDate(current => current || o.dates[0]?.date || "");
        setSlotId(current => current || o.slots.find(s => s.chargePaisa === 0)?.id || o.slots[0]?.id || "");
        setStoreId(current => current || o.pickupStores[0]?.id || "");
      }
    });
    listAddressesAction().then(list => {
      setAddresses(list);
      setAddressId(current => current || (list.find(a => a.isDefault) ?? list[0])?.id || "");
    });
  }, []);

  const lines = useMemo(() => (cart ?? []).map(i => ({ variantId: i.variantId!, cuttingTypeId: i.cuttingTypeId ?? null, quantity: i.quantity, instruction: i.instruction ?? null })), [cart]);
  const linesKey = JSON.stringify(lines);

  // every change that can move the price is priced again by the server
  useEffect(() => {
    if (!lines.length) { setQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    checkoutQuoteAction({ lines, deliveryType, addressId: deliveryType === "HOME_DELIVERY" ? addressId || null : null, storeId: deliveryType === "STORE_PICKUP" ? storeId || null : null, deliveryDate: date || null, slotId: slotId || null, useWallet }).then(res => {
      if (cancelled) return;
      setQuoting(false);
      if (res.ok) { setQuote(res.quote); setQuoteError(""); } else setQuoteError(res.error);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, deliveryType, addressId, storeId, date, slotId, useWallet]);

  const saveAddress = useCallback(async (values: AddressFormValues) => {
    const editId = editing?.id;
    const res = await saveAddressAction({
      label: values.addressType, contactName: values.recipient, phone: values.phone, altPhone: values.alternatePhone || undefined, line1: values.addressLine1,
      line2: values.addressLine2 || undefined, apartmentNumber: values.houseNumber || undefined, landmark: values.landmark || undefined, locality: values.locality || undefined,
      pincode: values.pincode, ...(editId ? {} : { makeDefault: true }),
    }, editId);
    if (!res.ok) return res.error;
    setAddresses(await listAddressesAction());
    picked.current = true;
    setAddressId(res.data.id);
    return null;
  }, [editing]);

  // the addresses in the city the customer is shopping in come first (that is where this order can be delivered)
  const shownAddresses = useMemo(() => {
    const here = (a: SavedAddress) => (a.cityId && options?.cityId ? (a.cityId === options.cityId ? 0 : 1) : 1);
    return [...(addresses ?? [])].sort((x, y) => here(x) - here(y) || Number(y.isDefault) - Number(x.isDefault));
  }, [addresses, options?.cityId]);

  // until the customer picks one, the first address of the shopping city (the default one first) is the chosen one
  const picked = useRef(false);
  useEffect(() => {
    if (picked.current || !options || !shownAddresses.length) return;
    setAddressId(shownAddresses[0].id);
  }, [shownAddresses, options]);

  const updateCart = (next: CartItem[]) => { setCart(next); writeCart(next); };
  const changeQuantity = (variantId: string, cuttingTypeId: string | null, delta: number) =>
    updateCart((cart ?? []).map(i => (i.variantId === variantId && (i.cuttingTypeId ?? null) === cuttingTypeId ? { ...i, quantity: Math.max(1, Math.min(99, i.quantity + delta)) } : i)));
  const removeLine = (variantId: string, cuttingTypeId: string | null) =>
    updateCart((cart ?? []).filter(i => !(i.variantId === variantId && (i.cuttingTypeId ?? null) === cuttingTypeId)));

  const selectedAddress = addresses?.find(a => a.id === addressId);
  const itemCount = quote ? quote.lines.filter(l => !l.problem).reduce((n, l) => n + l.quantity, 0) : (cart ?? []).reduce((n, i) => n + i.quantity, 0);
  const blockers = quote?.blockers ?? [];
  // the minimum-order message is put as a pop-up when the button is pressed, like the old site; the other problems stay on the page
  const showBlockers = quote?.popup && !quote.popup.submittable ? [] : blockers;
  const goShopping = () => router.push("/products");

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const res = await placeOrderAction({ lines, deliveryType, addressId: deliveryType === "HOME_DELIVERY" ? addressId || null : null, storeId: deliveryType === "STORE_PICKUP" ? storeId || null : null, deliveryDate: date, slotId, useWallet, paymentMethod: payment });
    if (!res.ok) { setSubmitting(false); showToast(`Error: ${res.error}`); return; }
    writeCart([]);
    try { window.sessionStorage.setItem("tazahat-flash", "Order Submit Successfully."); } catch { /* shown only when storage works */ }
    router.push("/orders");
  };

  /** the server's question (availability alert / delivery fee information / free delivery), then the order goes */
  const askPopup = (popup: CheckoutPopup) => {
    if (popup.type === "availability") {
      setDialog({
        title: popup.title, icon: popup.icon, onClose: () => undefined,
        body: <>
          <p>Seems some of your selected items might not be available per your selected delivery date/time.</p>
          <p>You can replace/remove the items listed below or change the delivery date/time. Or you can still submit without any change and we can deliver as per your preferred time but few item(s) might not be available as we would be waiting for the stock.</p>
          {popup.availability.length > 0 && <><h3>Products available for selected delivery date/time:</h3><ol>{popup.availability.map(a => <li key={a.name}><strong>{a.name}</strong>: <span>{a.date ?? ""}{a.notes.length ? ` (${a.notes.join("; ")})` : ""}</span></li>)}</ol></>}
          {popup.advance.length > 0 && <><h3>Products need advance order:</h3><ol>{popup.advance.map(a => <li key={a.name}><strong>{a.name}</strong>: <span>{a.date} ({a.note})</span></li>)}</ol></>}
        </>,
        buttons: [
          { label: "Continue Without Any Change", tone: "primary", onClick: submit },
          { label: "Edit Order", tone: "success", onClick: goShopping },
          { label: "Change Service Date", tone: "plain", onClick: () => document.querySelector(".checkout-date-grid")?.scrollIntoView({ behavior: "smooth", block: "center" }) },
        ],
      });
      return;
    }
    setDialog({
      title: popup.title, icon: popup.icon, onClose: () => undefined, body: <p>{popup.message}</p>,
      buttons: popup.submittable
        ? [{ label: "Continue Without Any Change", tone: "primary", onClick: submit }, { label: "Add Item", tone: "success", onClick: goShopping }]
        : [{ label: "Change order details", tone: "primary", onClick: () => { setIsAddressListOpen(true); document.querySelector(".checkout-address")?.scrollIntoView({ behavior: "smooth", block: "center" }); } }, { label: "Add Item", tone: "success", onClick: goShopping }],
    });
  };

  const afterToday = () => { if (quote?.popup) askPopup(quote.popup); else void submit(); };

  const proceed = () => {
    if (!cart?.length) return showToast("Your cart is empty.");
    if (deliveryType === "HOME_DELIVERY" && !addressId) return showToast("Please select a delivery address.");
    if (!date) return showToast("Please select a delivery date.");
    if (!slotId) return showToast("Please select a delivery schedule.");
    if (!quote || quoting) return showToast("Please wait, we are updating your prices.");
    if (quote.popup && !quote.popup.submittable) return askPopup(quote.popup);
    if (blockers.length) return showToast(blockers[0]);
    if (quote.today.isToday) {
      const pickup = deliveryType === "STORE_PICKUP";
      setDialog({
        title: "Warning Message?", icon: "warning",
        body: <>
          <p>Most of our clients prefer to order at-least a day ahead to choose from a wide variety of products.</p>
          <p>Are you sure, you want the {pickup ? "Pickup" : "Delivery"} <b className="is-today">Today?</b></p>
          <p><b>{longDate(date)}<br />{quote.slot?.time ?? quote.slot?.name}</b></p>
          {!pickup && <p>As per your delivery address looks like we might need approx {quote.today.processingHours} hour to process your order. Please Confirm?</p>}
        </>,
        buttons: [{ label: "Yes", tone: "success", onClick: afterToday }, { label: "Cancel", tone: "danger", onClick: () => undefined }],
      });
      return;
    }
    afterToday();
  };
  const applyCoupon = () => setCouponMessage(coupon.trim() ? "Coupons are not available yet." : "Enter a coupon code to apply.");
  const onlinePay = options?.payments.find(p => p.id === "ONLINE");
  const fee = (paisa: number) => (paisa > 0 ? money(paisa) : "Free");

  return (
    <main className="checkout-page">
      <div className="checkout-layout">
        <div className="checkout-left-scroll">
          <section className="checkout-section checkout-products">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="box" /></span><div><h2>Your Items <b>*</b></h2><p>{itemCount} {itemCount === 1 ? "item" : "items"} in your order</p></div></div>
            {cart === null ? <p className="checkout-empty-items">Loading your items…</p> : cart.length === 0 ? <p className="checkout-empty-items">No cart items were found. <Link href="/products">Add items to your cart</Link> to continue.</p> : <div className="checkout-product-list">{(quote?.lines ?? cart.map(i => ({ variantId: i.variantId!, cuttingTypeId: i.cuttingTypeId ?? null, quantity: i.quantity, instruction: i.instruction ?? null, name: i.name, image: i.image, packLabel: i.packLabel ?? null, dressingName: i.dressingName ?? null, dressingUnitPaisa: (i.dressingCharge ?? 0) * 100, linePaisa: i.price * i.quantity * 100, problem: null as string | null }))).map(item => {
              const original = cart.find(c => c.variantId === item.variantId && (c.cuttingTypeId ?? null) === item.cuttingTypeId);
              const image = item.image || original?.image || "";
              return <article className={`checkout-product${item.problem ? " has-problem" : ""}`} key={`${item.variantId}|${item.cuttingTypeId ?? ""}`}>
                <div className="checkout-product-image">{image && <Image src={image} alt={item.name} fill sizes="76px" unoptimized={isRemoteImage(image)} onError={fallbackImage} />}</div>
                <div className="checkout-product-info"><h3>{item.name}</h3>
                  <p>{[item.packLabel, item.dressingName ? `${item.dressingName}${item.dressingUnitPaisa > 0 ? ` (+${money(item.dressingUnitPaisa)} dressing)` : ""}` : ""].filter(Boolean).join(" · ")}</p>
                  {item.instruction && <p>“{item.instruction}”</p>}
                  <span className="checkout-qty" role="group" aria-label={`Quantity of ${item.name}`}>
                    <button type="button" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => changeQuantity(item.variantId, item.cuttingTypeId, -1)}>−</button>
                    <b aria-live="polite">{item.quantity}</b>
                    <button type="button" aria-label="Increase quantity" disabled={item.quantity >= 99} onClick={() => changeQuantity(item.variantId, item.cuttingTypeId, 1)}>+</button>
                    <button type="button" className="checkout-qty-remove" onClick={() => setDialog({ title: "Remove this item?", icon: "warning", body: <p>{item.name} will be taken out of your order.</p>, buttons: [{ label: "Yes, remove", tone: "danger", onClick: () => removeLine(item.variantId, item.cuttingTypeId) }, { label: "Keep it", tone: "plain", onClick: () => undefined }] })}>Remove</button>
                  </span>
                  {item.problem && <em className="checkout-product-problem">{item.problem} <Link href="/products">Change</Link></em>}</div>
                <strong className="checkout-product-price">{item.problem ? "—" : money(item.linePaisa)}</strong>
              </article>;
            })}</div>}
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="truck" /></span><div><h2>Delivery Type <b>*</b></h2><p>Choose your delivery type</p></div></div>
            <div className="checkout-options checkout-type-options">{([["HOME_DELIVERY", "Home Delivery", "⌂"], ["STORE_PICKUP", "Store Pick Up", "▣"]] as const).map(([id, label, icon]) => <button type="button" key={id} aria-pressed={deliveryType === id} className={`checkout-choice${deliveryType === id ? " selected" : ""}`} onClick={() => setDeliveryType(id)}><span className={`checkout-radio${deliveryType === id ? " checked" : ""}`}/><span className="checkout-choice-icon">{icon}</span><strong>{label}</strong></button>)}</div>
            <span className="checkout-wave" aria-hidden="true">〜〜</span>
          </section>

          {deliveryType === "HOME_DELIVERY" ? <section className="checkout-section checkout-address">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="pin" /></span><div><h1>Delivery Address <b>*</b></h1><p>Select your delivery address or add a new one</p></div></div>
            <button className="checkout-add-address" type="button" onClick={() => { setEditing(null); setIsAddressModalOpen(true); }}><span>＋</span> Add Address</button>
            {addresses === null ? <p className="checkout-empty-items">Loading your addresses…</p> : addresses.length === 0 ? <p className="checkout-empty-items">You have no saved address yet. Add one to get your order delivered.</p> : <>
              <button className={`checkout-address-choice${isAddressListOpen ? " is-open" : ""}`} type="button" aria-expanded={isAddressListOpen} onClick={() => setIsAddressListOpen(open => !open)}><span className="checkout-radio checked"/><span className="checkout-home-icon">⌂</span><strong>{selectedAddress ? <AddressLine a={selectedAddress} /> : "Select an address"}</strong><span className="checkout-chevron" aria-hidden="true"/></button>
              {isAddressListOpen && <div className="checkout-address-list" role="listbox" aria-label="Saved delivery addresses">{shownAddresses.map(a => <div key={a.id} role="option" aria-selected={addressId === a.id} className={`checkout-address-option${addressId === a.id ? " selected" : ""}${options?.cityId && a.cityId !== options.cityId ? " other-city" : ""}`}>
                <button type="button" className="checkout-address-pick" onClick={() => { picked.current = true; setAddressId(a.id); setIsAddressListOpen(false); }}><span className={`checkout-radio${addressId === a.id ? " checked" : ""}`}/><span><AddressLine a={a} /></span></button>
                <button type="button" className="checkout-address-edit" aria-label={`Edit ${a.label || "address"}`} title="Edit address" onClick={() => { setEditing(a); setIsAddressModalOpen(true); }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
              </div>)}</div>}
            </>}
          </section> : <section className="checkout-section checkout-address">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="pin" /></span><div><h1>Pick up from our store</h1><p>No delivery fee and no minimum order. Pay when you collect.{(options?.pickupStores.length ?? 0) > 1 ? " Choose the store you will visit." : ""}</p></div></div>
            {options === null ? null : options.pickupStores.length ? <div className="checkout-address-list" role="radiogroup" aria-label="Pickup stores">{options.pickupStores.map(st => <div key={st.id} role="radio" aria-checked={storeId === st.id} className={`checkout-address-option${storeId === st.id ? " selected" : ""}`}><button type="button" className="checkout-address-pick" onClick={() => setStoreId(st.id)}><span className={`checkout-radio${storeId === st.id ? " checked" : ""}`}/><span><strong>{st.name}</strong>{[st.areaName, st.pincode].filter(Boolean).length ? ` — ${[st.areaName, st.pincode].filter(Boolean).join(", ")}` : ""}{st.phone ? ` · ${st.phone}` : ""}</span></button></div>)}</div> : <p className="checkout-empty-items">We will tell you the pickup address when your order is confirmed.</p>}
          </section>}

          <section className="checkout-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="calendar" /></span><div><h2>{deliveryType === "HOME_DELIVERY" ? "Delivery Date" : "Pickup Date"} <b>*</b></h2><p>Choose your preferred date</p></div></div>
            <div className="checkout-date-grid" role="radiogroup" aria-label="Date">{(options?.dates ?? []).map(d => { const p = dayParts(d.date); const on = date === d.date; return <button key={d.date} type="button" role="radio" aria-checked={on} className={`checkout-date${on ? " selected" : ""}`} onClick={() => setDate(d.date)}><span>{p.month}</span><strong>{p.date}</strong><b>{d.label === "Today" || d.label === "Tomorrow" ? d.label : p.day}</b>{on && <i>✓</i>}</button>; })}</div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="clock" /></span><div><h2>{deliveryType === "HOME_DELIVERY" ? "Delivery Schedule" : "Pickup Time"} <b>*</b></h2><p>Select your preferred time</p></div></div>
            <div className="checkout-schedule-grid" role="radiogroup" aria-label="Time">{(options?.slots ?? []).map(s => { const on = slotId === s.id; return <label key={s.id} className={`checkout-schedule${on ? " selected" : ""}`}><input type="radio" name="schedule" checked={on} onChange={() => setSlotId(s.id)}/><span className={`checkout-radio${on ? " checked" : ""}`}/><span><strong>{s.name}</strong> {s.time && <small>({s.time.replace(/\s+/g, " ")})</small>}{s.chargePaisa > 0 && <b className="schedule-fee"> +{money(s.chargePaisa)}</b>}</span></label>; })}</div>
          </section>

          <section className="checkout-section checkout-payment-section">
            <div className="checkout-section-heading"><span className="checkout-icon"><Icon name="card" /></span><div><h2>Payment Option <b>*</b></h2><p>Select your preferred payment method</p></div></div>
            <div className="checkout-options checkout-payment-options">
              <button type="button" aria-disabled={!onlinePay?.enabled} disabled={!onlinePay?.enabled} className={`checkout-choice is-disabled${payment === "ONLINE" ? " selected" : ""}`} onClick={() => onlinePay?.enabled && setPayment("ONLINE")}><span className={`checkout-radio${payment === "ONLINE" ? " checked" : ""}`}/><span className="checkout-choice-icon">▰</span><strong>Online Payment</strong><small className="checkout-soon">{onlinePay?.note ?? "Coming soon"}</small></button>
              <button type="button" aria-pressed={payment === "COD"} className={`checkout-choice${payment === "COD" ? " selected" : ""}`} onClick={() => setPayment("COD")}><span className={`checkout-radio${payment === "COD" ? " checked" : ""}`}/><span className="checkout-choice-icon">♧</span><strong>{deliveryType === "HOME_DELIVERY" ? "Cash On Delivery" : "Pay at Store"}</strong></button>
            </div>
            {(options?.walletBalancePaisa ?? 0) > 0 && <label className="checkout-wallet"><input type="checkbox" checked={useWallet} onChange={e => setUseWallet(e.target.checked)}/> Use my wallet balance ({money(options!.walletBalancePaisa)})</label>}
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-heading"><span className="checkout-summary-icon"><Icon name="receipt" /></span><div><h2>Estimated Price Details</h2><p>Review your order details and apply coupon code</p></div></div>
          <form className="checkout-coupon" onSubmit={event => { event.preventDefault(); applyCoupon(); }}><span>♧</span><input aria-label="Coupon code" value={coupon} onChange={event => setCoupon(event.target.value)} placeholder="Enter coupon code"/><button type="submit">Apply</button></form>
          {couponMessage && <p className="checkout-coupon-message" role="status">{couponMessage}</p>}
          <p className="checkout-note"><span>i</span><span>Please note we bill based on the actual wt. of the products. Final amount may vary depending on the actual item wt. during packaging. Thank you.</span></p>
          <div className={`checkout-price-rows${quoting ? " is-updating" : ""}`}>
            <div className="checkout-price-row"><Icon name="box"/><span>Total {itemCount} {itemCount === 1 ? "Item" : "Items"}</span><strong>{money(quote?.itemsPaisa ?? 0)}</strong></div>
            <div className="checkout-price-row"><Icon name="drop"/><span>Dressing Fee</span><b>{fee(quote?.dressingPaisa ?? 0)}</b></div>
            <div className="checkout-price-row"><Icon name="truck"/><span>Delivery Fee</span><b>{deliveryType === "STORE_PICKUP" ? "Free" : fee(quote?.deliveryPaisa ?? 0)}</b></div>
            <div className="checkout-price-row"><Icon name="shield"/><span>Convenience Fee</span><b>{deliveryType === "STORE_PICKUP" ? "Free" : fee(quote?.convenienceFeePaisa ?? 0)}</b></div>
            <div className="checkout-price-row"><span className="checkout-lightning">ϟ</span><span>Fast Processing Charge</span><b>{fee(quote?.slotFeePaisa ?? 0)}</b></div>
            <div className="checkout-price-row"><Icon name="tag"/><span>Promo</span><b>{money(0)}</b></div>
            {(quote?.walletUsedPaisa ?? 0) > 0 && <div className="checkout-price-row"><Icon name="card"/><span>Wallet</span><b>−{money(quote!.walletUsedPaisa)}</b></div>}
          </div>
          {quote?.notes.map(n => <p className="checkout-hint" key={n}>{n}</p>)}
          <div className="checkout-total"><span>₹</span><strong>{(quote?.walletUsedPaisa ?? 0) > 0 ? "To Pay" : "Total Amount"}</strong><b>{money(quote?.payablePaisa ?? 0)}</b></div>
          {quoteError && <p className="checkout-blocker" role="alert">{quoteError}</p>}
          {showBlockers.map(b => <p className="checkout-blocker" role="alert" key={b}>{b}</p>)}
          <button type="button" className="checkout-proceed" disabled={quoting || submitting || !cart?.length} onClick={proceed}><span>🛒</span>{submitting ? "PLACING ORDER…" : quoting ? "UPDATING…" : "PLACE ORDER"}<span>›</span></button>
          <div className="checkout-promo-art"><div className="checkout-promo-copy">Fresh<br/>From River<br/>To Your Table</div><Image src="/images/products/product--2.png" alt="Fresh fish" fill sizes="(max-width: 800px) 40vw, 300px"/></div>
        </aside>
      </div>
      {dialog && <CheckoutDialog spec={dialog} onDismiss={() => setDialog(null)} />}
      {toast && <div className={`checkout-toast is-${toast.tone}`} role="alert">{toast.text}</div>}
      {isAddressModalOpen && <Address key={editing?.id ?? "new"} initialValues={editing ? toFormValues(editing) : undefined} onClose={() => { setIsAddressModalOpen(false); setEditing(null); }} onSave={saveAddress} />}
    </main>
  );
}

/** Needs a login: without one the page asks the visitor to log in. */
export default function CheckoutPage() {
  return <RequireLogin what="checkout and place your order"><CheckoutContent /></RequireLogin>;
}
