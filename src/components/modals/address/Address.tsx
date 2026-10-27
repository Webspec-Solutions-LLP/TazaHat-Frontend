"use client";

import { useEffect, useId, useRef, useState } from "react";
import "./Address.css";

export interface AddressFormValues {
  addressType: string;
  recipient: string;
  phone: string;
  alternatePhone: string;
  locality: string;
  addressLine1: string;
  addressLine2: string;
  houseNumber: string;
  landmark: string;
  pincode: string;
}

interface AddressProps {
  onClose: () => void;
  onSave: (values: AddressFormValues) => void;
  initialValues?: Partial<AddressFormValues>;
}

const EMPTY_ADDRESS: AddressFormValues = {
  addressType: "",
  recipient: "",
  phone: "",
  alternatePhone: "",
  locality: "",
  addressLine1: "",
  addressLine2: "",
  houseNumber: "",
  landmark: "",
  pincode: "",
};

function getInitialValues(values?: Partial<AddressFormValues>): AddressFormValues {
  return { ...EMPTY_ADDRESS, ...values };
}

export default function Address({ onClose, onSave, initialValues }: AddressProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(() => getInitialValues(initialValues));
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const isEditing = Boolean(initialValues);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    dialog?.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClose, prefersReducedMotion ? 0 : 400);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const closeSidebar = () => setClosing(true);
  const updateValue = (field: keyof AddressFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const submitAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(values);
    closeSidebar();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`address-sidebar-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        closeSidebar();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeSidebar();
      }}
    >
      <section className="address-sidebar-panel">
        <header className="address-sidebar-header">
          <button className="address-sidebar-close" type="button" aria-label="Close address form" onClick={closeSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
          <div>
            <h2 id={titleId}>{isEditing ? "Edit Address" : "Add New Address"}</h2>
            <p>Enter your delivery details</p>
          </div>
        </header>

        <form className="address-sidebar-form" onSubmit={submitAddress}>
          <div className="address-sidebar-fields">
            <fieldset className="address-field address-type-field">
              <legend>Address Type <b>*</b></legend>
              <div className="address-type-options" role="radiogroup" aria-label="Address type">
                {["Home", "Office", "Other"].map((type, index) => (
                  <label className={`address-type-option${values.addressType === type ? " is-selected" : ""}`} key={type}>
                    <input
                      type="radio"
                      name="address-type"
                      value={type}
                      required={index === 0}
                      checked={values.addressType === type}
                      onChange={() => updateValue("addressType", type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="address-field">
              <span>Contact Name for Delivery <b>*</b></span>
              <input required autoComplete="name" placeholder="Enter Name" value={values.recipient} onChange={(event) => updateValue("recipient", event.target.value)} />
            </label>

            <label className="address-field">
              <span>Enter your phone number <b>*</b></span>
              <span className="address-phone-input"><span>+91</span><input required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit number" value={values.phone} onChange={(event) => updateValue("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} /></span>
            </label>

            <label className="address-field">
              <span>Enter alternate phone number <b>*</b></span>
              <span className="address-phone-input"><span>+91</span><input required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit number" value={values.alternatePhone} onChange={(event) => updateValue("alternatePhone", event.target.value.replace(/\D/g, "").slice(0, 10))} /></span>
            </label>

            <label className="address-field">
              <span>Locality <b>*</b></span>
              <input required autoComplete="address-level3" value={values.locality} onChange={(event) => updateValue("locality", event.target.value)} />
            </label>

            <label className="address-field">
              <span>House Number</span>
              <input autoComplete="address-line2" value={values.houseNumber} onChange={(event) => updateValue("houseNumber", event.target.value)} />
            </label>

            <label className="address-field">
              <span>Address line 1 <b>*</b></span>
              <textarea required rows={2} autoComplete="address-line1" value={values.addressLine1} onChange={(event) => updateValue("addressLine1", event.target.value)} />
            </label>

            <label className="address-field">
              <span>Address line 2</span>
              <textarea rows={2} value={values.addressLine2} onChange={(event) => updateValue("addressLine2", event.target.value)} />
            </label>

            <label className="address-field">
              <span>Landmark <b>*</b></span>
              <input required value={values.landmark} onChange={(event) => updateValue("landmark", event.target.value)} />
            </label>

            <label className="address-field">
              <span>Pin code <b>*</b></span>
              <input required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength={6} placeholder="Enter PIN" value={values.pincode} onChange={(event) => updateValue("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
          </div>

          <footer className="address-sidebar-footer">
            <button type="button" className="address-cancel-button" onClick={closeSidebar}>Cancel</button>
            <button type="submit" className="address-submit-button">{isEditing ? "SAVE ADDRESS" : "ADD ADDRESS"}</button>
          </footer>
        </form>
      </section>
    </dialog>
  );
}