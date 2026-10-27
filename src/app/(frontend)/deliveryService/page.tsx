"use client";

import { useState } from "react";
import "./DeliveryService.css";

// Icons matching the design screenshot
function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L18 8h-4v9h2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function CalendarBadgeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <circle cx="8" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function CalendarOutlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function ClockOutlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}

function PackageBoxIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function WeightBagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="3" />
      <path d="M6.5 8a2 2 0 0 0-1.9 1.4l-2.4 8A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.9-2.6l-2.4-8A2 2 0 0 0 17.5 8z" />
      <path d="M12 11v5" />
      <path d="M10.5 12.5 12 11" />
    </svg>
  );
}

function CubeSizeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 16-9 5-9-5V8l9-5 9 5Z" />
      <path d="m3.3 7.3 8.7 4.7 8.7-4.7" />
      <path d="M12 12v9" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function CardPaymentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function SendPlaneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Initial pre-configured addresses
const initialAddresses = [
  "House #14, Road #3, Banamalipur, Agartala, Tripura - 799001",
  "Flat 3B, Sunshine Residency, Ramnagar, Agartala - 799002",
  "Plot 45, Market Lane, Indranagar, Agartala, Tripura - 799006",
];

const timeSlots = [
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
  "08:00 PM - 10:00 PM",
];

const packageContainOptions = [
  "Fresh Fish & Seafood",
  "Fresh Meat & Poultry",
  "Fresh Vegetables & Fruits",
  "Dairy & Grocery Staples",
  "Home Cooked Food / Bakery",
  "Important Documents / Parcels",
  "Medicines / Healthcare Items",
  "Clothes / Personal Belongings",
  "Others",
];

const packageWeightOptions = [
  "Up to 1 KG",
  "1 KG - 3 KG",
  "3 KG - 5 KG",
  "5 KG - 10 KG",
  "10 KG - 15 KG",
  "Above 15 KG",
];

const packageSizeOptions = [
  "Small (Envelope / Pouch)",
  "Medium (Standard Shoebox size)",
  "Large (Big Carton / Sack)",
  "Extra Large (Heavy / Bulk Parcel)",
];

const packetCountOptions = [
  "1 Packet",
  "2 Packets",
  "3 Packets",
  "4 Packets",
  "5 Packets",
  "6 - 10 Packets",
  "More than 10 Packets",
];

export default function DeliveryServicePage() {
  const [addresses, setAddresses] = useState<string[]>(initialAddresses);
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [packageContains, setPackageContains] = useState<string>("");
  const [packageWeight, setPackageWeight] = useState<string>("");
  const [packageSize, setPackageSize] = useState<string>("");
  const [totalPackets, setTotalPackets] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"pickup" | "delivery">("pickup");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  // Modal State for adding a new address
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<"pickup" | "delivery">("pickup");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newPincode, setNewPincode] = useState("799001");

  // Submission feedback
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const openAddressModal = (target: "pickup" | "delivery") => {
    setModalTarget(target);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setNewFullName("");
    setNewPhone("");
    setNewStreet("");
    setNewArea("");
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) return;

    const formattedAddress = `${newFullName ? `${newFullName}, ` : ""}${newStreet.trim()}, ${newArea ? `${newArea}, ` : ""}Agartala - ${newPincode}${newPhone ? ` (Ph: ${newPhone})` : ""}`;

    setAddresses(prev => [formattedAddress, ...prev]);

    if (modalTarget === "pickup") {
      setPickupAddress(formattedAddress);
    } else {
      setDeliveryAddress(formattedAddress);
    }

    closeAddressModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupAddress) {
      alert("Please select or add a Pickup address.");
      return;
    }
    if (!deliveryAddress) {
      alert("Please select or add a Delivery address.");
      return;
    }
    if (!pickupDate) {
      alert("Please select a Pickup date.");
      return;
    }
    if (!pickupTime) {
      alert("Please select a Pick-up time slot.");
      return;
    }
    if (!packageContains) {
      alert("Please choose what the package contains.");
      return;
    }
    if (!packageWeight) {
      alert("Please choose package weight.");
      return;
    }
    if (!packageSize) {
      alert("Please choose package size.");
      return;
    }
    if (!totalPackets) {
      alert("Please choose total number of packets.");
      return;
    }

    const trackingId = `TH-DS-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedMessage(
      `Delivery request booked successfully! Your tracking code is #${trackingId}. Our rider will contact you soon.`
    );

    // Scroll smoothly to top of card to show confirmation
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  return (
    <main className="delivery-page">
      <div className="delivery-card-container">
        <div className="delivery-card">
          {submittedMessage && (
            <div className="delivery-success-alert" role="alert">
              <span>{submittedMessage}</span>
              <button
                type="button"
                className="delivery-modal-close"
                onClick={() => setSubmittedMessage(null)}
                aria-label="Dismiss alert"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <form className="delivery-form" onSubmit={handleSubmit}>
            <div className="delivery-form-intro">
              <span className="delivery-form-eyebrow">FAST & RELIABLE</span>
              <h2 className="delivery-form-title">Book a delivery</h2>
              <p className="delivery-form-description">
                Share your pickup and delivery details to arrange a convenient doorstep service.
              </p>
            </div>

            {/* Row 1: Pickup Address & Delivery Address */}
            <div className="delivery-form-row">
              {/* Pickup Address */}
              <div className="delivery-field-group">
                <div className="delivery-field-header">
                  <div className="delivery-label-wrap">
                    <span className="delivery-icon-badge" aria-hidden="true">
                      <PinIcon />
                    </span>
                    <label htmlFor="pickup-address-select" className="delivery-label">
                      Pickup address <span className="delivery-required">*</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="delivery-add-btn"
                    onClick={() => openAddressModal("pickup")}
                  >
                    <PlusIcon /> Add Address
                  </button>
                </div>
                <div className="delivery-input-control">
                  <select
                    id="pickup-address-select"
                    className="delivery-select"
                    value={pickupAddress}
                    onChange={e => setPickupAddress(e.target.value)}
                    required
                  >
                    <option value="">Select Pickup Address</option>
                    {addresses.map((addr, idx) => (
                      <option key={`pickup-${idx}`} value={addr}>
                        {addr}
                      </option>
                    ))}
                  </select>
                  <span className="delivery-select-arrow" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="delivery-field-group">
                <div className="delivery-field-header">
                  <div className="delivery-label-wrap">
                    <span className="delivery-icon-badge" aria-hidden="true">
                      <TruckIcon />
                    </span>
                    <label htmlFor="delivery-address-select" className="delivery-label">
                      Delivery address <span className="delivery-required">*</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="delivery-add-btn"
                    onClick={() => openAddressModal("delivery")}
                  >
                    <PlusIcon /> Add Address
                  </button>
                </div>
                <div className="delivery-input-control">
                  <select
                    id="delivery-address-select"
                    className="delivery-select"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    required
                  >
                    <option value="">Select Delivery Address</option>
                    {addresses.map((addr, idx) => (
                      <option key={`delivery-${idx}`} value={addr}>
                        {addr}
                      </option>
                    ))}
                  </select>
                  <span className="delivery-select-arrow" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Pickup date & time (Label covers both columns) */}
            <div className="delivery-field-group">
              <div className="delivery-field-header">
                <div className="delivery-label-wrap">
                  <span className="delivery-icon-badge" aria-hidden="true">
                    <CalendarBadgeIcon />
                  </span>
                  <span className="delivery-label">
                    Pickup date &amp; time <span className="delivery-required">*</span>
                  </span>
                </div>
              </div>

              <div className="delivery-date-time-grid">
                {/* Date Input */}
                <div className="delivery-date-input-wrap">
                  <span className="delivery-input-icon-left" aria-hidden="true">
                    <CalendarOutlineIcon />
                  </span>
                  <input
                    type="date"
                    id="pickup-date-input"
                    className="delivery-date-input"
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    placeholder="Choose Pickup Date.."
                    min={new Date().toISOString().split("T")[0]}
                    required
                    aria-label="Choose Pickup Date"
                  />
                </div>

                {/* Time Select */}
                <div className="delivery-time-select-wrap">
                  <span className="delivery-input-icon-left" aria-hidden="true">
                    <ClockOutlineIcon />
                  </span>
                  <select
                    id="pickup-time-select"
                    className="delivery-time-select"
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    required
                    aria-label="Select Pick-up Time"
                  >
                    <option value="">Select Pick-up Time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <span className="delivery-select-arrow" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Notice Alert Banner */}
            <div className="delivery-notice-box" role="note">
              <span className="delivery-notice-icon" aria-hidden="true">
                <InfoCircleIcon />
              </span>
              <p className="delivery-notice-text">
                Please note, we deliver all packages on same day as soon as those are picked up. In case, storage is needed after pick up and delivery needs to be halted, please contact{" "}
                <strong className="delivery-notice-highlight">customer care in Live Chat for special request</strong>.
              </p>
            </div>

            {/* Row 4: Package contains (Full Width) */}
            <div className="delivery-field-group">
              <div className="delivery-field-header">
                <div className="delivery-label-wrap">
                  <span className="delivery-icon-badge" aria-hidden="true">
                    <PackageBoxIcon />
                  </span>
                  <label htmlFor="package-contains-select" className="delivery-label">
                    Package contains <span className="delivery-required">*</span>
                  </label>
                </div>
              </div>
              <div className="delivery-input-control">
                <select
                  id="package-contains-select"
                  className="delivery-select"
                  value={packageContains}
                  onChange={e => setPackageContains(e.target.value)}
                  required
                >
                  <option value="">Select Package Contain</option>
                  {packageContainOptions.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="delivery-select-arrow" aria-hidden="true">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>

            {/* Row 5: Package Weight & Package Size */}
            <div className="delivery-form-row">
              {/* Package Weight */}
              <div className="delivery-field-group">
                <div className="delivery-field-header">
                  <div className="delivery-label-wrap">
                    <span className="delivery-icon-badge" aria-hidden="true">
                      <WeightBagIcon />
                    </span>
                    <label htmlFor="package-weight-select" className="delivery-label">
                      Package weight <span className="delivery-required">*</span>
                    </label>
                  </div>
                </div>
                <div className="delivery-input-control">
                  <select
                    id="package-weight-select"
                    className="delivery-select"
                    value={packageWeight}
                    onChange={e => setPackageWeight(e.target.value)}
                    required
                  >
                    <option value="">Select Package Weight</option>
                    {packageWeightOptions.map(weight => (
                      <option key={weight} value={weight}>
                        {weight}
                      </option>
                    ))}
                  </select>
                  <span className="delivery-select-arrow" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>

              {/* Package Size */}
              <div className="delivery-field-group">
                <div className="delivery-field-header">
                  <div className="delivery-label-wrap">
                    <span className="delivery-icon-badge" aria-hidden="true">
                      <CubeSizeIcon />
                    </span>
                    <label htmlFor="package-size-select" className="delivery-label">
                      Package size <span className="delivery-required">*</span>
                    </label>
                  </div>
                </div>
                <div className="delivery-input-control">
                  <select
                    id="package-size-select"
                    className="delivery-select"
                    value={packageSize}
                    onChange={e => setPackageSize(e.target.value)}
                    required
                  >
                    <option value="">Select Package Size</option>
                    {packageSizeOptions.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="delivery-select-arrow" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>
            </div>

            {/* Row 6: Total no of packet & Payment Mode */}
            <div className="delivery-form-row">
              {/* Total no of packet */}
              <div className="delivery-field-group">
                <div className="delivery-field-header">
                  <div className="delivery-label-wrap">
                    <span className="delivery-icon-badge" aria-hidden="true">
                      <LayersIcon />
                    </span>
                    <label htmlFor="total-packet-select" className="delivery-label">
                      Total no of packet <span className="delivery-required">*</span>
                    </label>
                  </div>
                </div>
                <div className="delivery-input-control">
                  <select
                    id="total-packet-select"
                    className="delivery-select"
                    value={totalPackets}
                    onChange={e => setTotalPackets(e.target.value)}
                    required
                  >
                    <option value="">Select Total No Of Packet</option>
                    {packetCountOptions.map(count => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <span className="delivery-select-arrow" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="delivery-field-group">
                <div className="delivery-field-header">
                  <div className="delivery-label-wrap">
                    <span className="delivery-icon-badge" aria-hidden="true">
                      <CardPaymentIcon />
                    </span>
                    <span className="delivery-label">
                      Payment mode <span className="delivery-required">*</span>
                    </span>
                  </div>
                </div>
                <div className="delivery-payment-modes" role="radiogroup" aria-label="Payment Mode">
                  <label className="delivery-radio-option">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="pickup"
                      className="delivery-radio-input"
                      checked={paymentMode === "pickup"}
                      onChange={() => setPaymentMode("pickup")}
                    />
                    <span className="delivery-radio-custom" aria-hidden="true">
                      <span className="delivery-radio-dot" />
                    </span>
                    <span className="delivery-radio-text">Pay on pickup</span>
                  </label>

                  <label className="delivery-radio-option">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="delivery"
                      className="delivery-radio-input"
                      checked={paymentMode === "delivery"}
                      onChange={() => setPaymentMode("delivery")}
                    />
                    <span className="delivery-radio-custom" aria-hidden="true">
                      <span className="delivery-radio-dot" />
                    </span>
                    <span className="delivery-radio-text">Pay on delivery</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Row 7: Special Instructions (Full Width) */}
            <div className="delivery-field-group">
              <div className="delivery-field-header">
                <div className="delivery-label-wrap">
                  <span className="delivery-icon-badge" aria-hidden="true">
                    <NoteIcon />
                  </span>
                  <label htmlFor="special-instructions" className="delivery-label">
                    Please write here if any special instructions for us.
                  </label>
                </div>
              </div>
              <textarea
                id="special-instructions"
                className="delivery-textarea"
                rows={3}
                placeholder="Please write here if any special instructions for us."
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
              />
            </div>

            {/* Row 8: Submit Button */}
            <div className="delivery-submit-wrap">
              <button type="submit" className="delivery-submit-btn">
                <SendPlaneIcon />
                <span>SUBMIT</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Address Modal Dialog */}
      {isAddressModalOpen && (
        <div className="delivery-modal-backdrop" onClick={closeAddressModal}>
          <div
            className="delivery-modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-address-title"
          >
            <div className="delivery-modal-header">
              <h2 id="add-address-title" className="delivery-modal-title">
                {modalTarget === "pickup" ? "Add New Pickup Address" : "Add New Delivery Address"}
              </h2>
              <button
                type="button"
                className="delivery-modal-close"
                onClick={closeAddressModal}
                aria-label="Close dialog"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="delivery-modal-form">
              <div className="delivery-modal-input-group">
                <label className="delivery-modal-label">Contact Person Name</label>
                <input
                  type="text"
                  className="delivery-modal-input"
                  placeholder="e.g. Rahul Sen"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                />
              </div>

              <div className="delivery-modal-input-group">
                <label className="delivery-modal-label">Phone Number</label>
                <input
                  type="tel"
                  className="delivery-modal-input"
                  placeholder="e.g. +91 9876543210"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                />
              </div>

              <div className="delivery-modal-input-group">
                <label className="delivery-modal-label">House / Flat / Road / Street *</label>
                <input
                  type="text"
                  className="delivery-modal-input"
                  placeholder="e.g. House #22, Lane 4, Banamalipur"
                  value={newStreet}
                  onChange={e => setNewStreet(e.target.value)}
                  required
                />
              </div>

              <div className="delivery-modal-input-group">
                <label className="delivery-modal-label">Area / Locality / Landmark</label>
                <input
                  type="text"
                  className="delivery-modal-input"
                  placeholder="e.g. Near City Center"
                  value={newArea}
                  onChange={e => setNewArea(e.target.value)}
                />
              </div>

              <div className="delivery-modal-input-group">
                <label className="delivery-modal-label">Pincode</label>
                <input
                  type="text"
                  className="delivery-modal-input"
                  placeholder="799001"
                  value={newPincode}
                  onChange={e => setNewPincode(e.target.value)}
                />
              </div>

              <div className="delivery-modal-actions">
                <button type="button" className="delivery-modal-cancel" onClick={closeAddressModal}>
                  Cancel
                </button>
                <button type="submit" className="delivery-modal-save">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
