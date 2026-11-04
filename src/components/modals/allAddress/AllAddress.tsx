"use client";

import { useBackClose } from "@/lib/backLayers";
import { useEffect, useId, useRef, useState } from "react";
import type { SavedAddress } from "@/app/address-actions";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "@/app/(frontend)/profile/english.json";
import bengaliText from "@/app/(frontend)/profile/bengali.json";
import hindiText from "@/app/(frontend)/profile/hindi.json";
import "./AllAddress.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface AllAddressProps {
  addresses: SavedAddress[] | null;
  note: string;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (address: SavedAddress) => void;
  onDelete: (id: string) => void;
  onMakeDefault: (id: string) => void;
}

function AddressIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function AllAddress({
  addresses,
  note,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  onMakeDefault,
}: AllAddressProps) {
  const [language] = useLanguage();
  const t = textMap[language] || englishText;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClose, reducedMotion ? 0 : 480);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const close = () => setClosing(true);
  useBackClose(close);

  return (
    <dialog
      ref={dialogRef}
      className={`all-address-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="all-address-panel" lang={t.language}>
        <header className="all-address-header">
          <div className="all-address-title">
            <h2 id={titleId}>{t.addressTitle}</h2>
            <p>{t.addressSubtitle}</p>
          </div>
          <button className="all-address-add" type="button" onClick={onAdd}>
            <AddressIcon><path d="M12 5v14m-7-7h14" /></AddressIcon>
            {t.addAddress}
          </button>
          <button className="all-address-close" type="button" aria-label={t.closeAria} onClick={close}>×</button>
        </header>

        <div className="all-address-list">
          {note && <p className="all-address-note" role="alert">{note}</p>}
          {addresses === null && Array.from({ length: 2 }, (_, index) => (
            <div className="all-address-skeleton sk" key={index} aria-hidden="true" />
          ))}
          {addresses?.length === 0 && <p className="all-address-empty">{t.noAddresses}</p>}
          {addresses?.map((address) => {
            const label = address.label || t.defaultLabel;
            const details = [
              address.apartmentNumber,
              address.line1,
              address.line2,
              address.locality,
              address.landmark,
              address.cityName,
              address.pincode,
            ].filter(Boolean).join(", ");

            return (
              <article className={`all-address-card${address.isDefault ? " is-default" : ""}`} key={address.id}>
                <label className="all-address-choice">
                  <input
                    type="radio"
                    name="all-address-default"
                    checked={address.isDefault}
                    onChange={() => onMakeDefault(address.id)}
                    aria-label={t.makeDefaultAria.replace("{label}", label)}
                  />
                  <span>{address.contactName} ({label})</span>
                </label>
                <div className="all-address-actions">
                  <button type="button" aria-label={t.editAria.replace("{label}", label)} onClick={() => onEdit(address)}>
                    <AddressIcon><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /></AddressIcon>
                  </button>
                  <button type="button" aria-label={t.deleteAria.replace("{label}", label)} onClick={() => onDelete(address.id)}>
                    <AddressIcon><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></AddressIcon>
                  </button>
                </div>
                <p className="all-address-details">{label}: {details}</p>
                <p className="all-address-phone">
                  <AddressIcon><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></AddressIcon>
                  {address.phone}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </dialog>
  );
}