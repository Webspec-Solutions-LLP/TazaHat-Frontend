"use client";

import { useBackClose } from "@/lib/backLayers";
import { useEffect, useId, useRef, useState } from "react";
import { lookupPincodeAction } from "@/app/address-actions";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./Address.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

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
  /** save the address; return an error text to keep the form open and show it */
  onSave: (values: AddressFormValues) => void | string | null | Promise<void | string | null>;
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
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;

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
  useBackClose(closeSidebar);
  const updateValue = (field: keyof AddressFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pinInfo, setPinInfo] = useState<{ serviceable: boolean; text: string } | null>(null);

  // a full PIN code is checked as soon as it is typed: do we deliver there, and to which city
  useEffect(() => {
    if (!/^\d{6}$/.test(values.pincode)) { setPinInfo(null); return; }
    let cancelled = false;
    lookupPincodeAction(values.pincode).then(info => {
      if (cancelled || !info) return;
      const locations = [info.city, info.state].filter(Boolean).join(", ");
      setPinInfo(
        info.serviceable
          ? { serviceable: true, text: t.pincodeServiceable.replace("{locations}", locations) }
          : { serviceable: false, text: t.pincodeNotServiceable }
      );
    });
    return () => { cancelled = true; };
  }, [values.pincode, t.pincodeServiceable, t.pincodeNotServiceable]);

  const submitAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const problem = await onSave(values);
    setSaving(false);
    if (problem) { setError(problem); return; }
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
      <section className="address-sidebar-panel" lang={t.language}>
        <header className="address-sidebar-header">
          <button className="address-sidebar-close" type="button" aria-label={t.closeAria} onClick={closeSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
          <div>
            <h2 id={titleId}>{isEditing ? t.editTitle : t.addTitle}</h2>
            <p>{t.subtitle}</p>
          </div>
        </header>

        <form className="address-sidebar-form" onSubmit={submitAddress}>
          <div className="address-sidebar-fields">
            <fieldset className="address-field address-type-field">
              <legend>{t.addressTypeLegend} <b>*</b></legend>
              <div className="address-type-options" role="radiogroup" aria-label={t.addressTypeAria}>
                {t.addressTypes.map((type, index) => (
                  <label className={`address-type-option${values.addressType === type.id ? " is-selected" : ""}`} key={type.id}>
                    <input
                      type="radio"
                      name="address-type"
                      value={type.id}
                      required={index === 0}
                      checked={values.addressType === type.id}
                      onChange={() => updateValue("addressType", type.id)}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="address-field">
              <span>{t.contactNameLabel} <b>*</b></span>
              <input required autoComplete="name" placeholder={t.contactNamePlaceholder} value={values.recipient} onChange={(event) => updateValue("recipient", event.target.value)} />
            </label>

            <label className="address-field">
              <span>{t.phoneLabel} <b>*</b></span>
              <span className="address-phone-input"><span>+91</span><input required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} placeholder={t.phonePlaceholder} value={values.phone} onChange={(event) => updateValue("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} /></span>
            </label>

            <label className="address-field">
              <span>{t.altPhoneLabel} <b>*</b></span>
              <span className="address-phone-input"><span>+91</span><input required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder={t.altPhonePlaceholder} value={values.alternatePhone} onChange={(event) => updateValue("alternatePhone", event.target.value.replace(/\D/g, "").slice(0, 10))} /></span>
            </label>

            <label className="address-field">
              <span>{t.localityLabel} <b>*</b></span>
              <input required autoComplete="address-level3" value={values.locality} onChange={(event) => updateValue("locality", event.target.value)} />
            </label>

            <label className="address-field">
              <span>{t.houseNumberLabel}</span>
              <input autoComplete="address-line2" value={values.houseNumber} onChange={(event) => updateValue("houseNumber", event.target.value)} />
            </label>

            <label className="address-field">
              <span>{t.addressLine1Label} <b>*</b></span>
              <textarea required rows={2} autoComplete="address-line1" value={values.addressLine1} onChange={(event) => updateValue("addressLine1", event.target.value)} />
            </label>

            <label className="address-field">
              <span>{t.addressLine2Label}</span>
              <textarea rows={2} value={values.addressLine2} onChange={(event) => updateValue("addressLine2", event.target.value)} />
            </label>

            <label className="address-field">
              <span>{t.landmarkLabel} <b>*</b></span>
              <input required value={values.landmark} onChange={(event) => updateValue("landmark", event.target.value)} />
            </label>

            <label className="address-field">
              <span>{t.pincodeLabel} <b>*</b></span>
              <input required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength={6} placeholder={t.pincodePlaceholder} value={values.pincode} onChange={(event) => updateValue("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
            {pinInfo && <p className={`address-pin-info${pinInfo.serviceable ? " is-ok" : " is-bad"}`} role="status">{pinInfo.text}</p>}
            {error && <p className="address-pin-info is-bad" role="alert">{error}</p>}
          </div>

          <footer className="address-sidebar-footer">
            <button type="button" className="address-cancel-button" onClick={closeSidebar}>{t.cancelButton}</button>
            <button type="submit" className="address-submit-button" disabled={saving}>{saving ? t.savingButton : isEditing ? t.saveAddressButton : t.addAddressButton}</button>
          </footer>
        </form>
      </section>
    </dialog>
  );
}
