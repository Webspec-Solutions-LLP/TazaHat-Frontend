"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CANCEL_REASONS, OTHER_REASON } from "@/lib/orderReasons";
import "./CancelReasonDialog.css";

/** The small pop-up that asks why an item / an order is cancelled: pick a reason, or "Others" and type it. */
export default function CancelReasonDialog({ title, subject, request, onSubmit, onClose }: {
  title: string;
  /** what is being cancelled, shown under the title */
  subject: string;
  /** the shop has started on the order: this is a request, not an immediate cancel */
  request: boolean;
  /** return an error text to keep the pop-up open and show it */
  onSubmit: (reason: string, details: string) => Promise<string | null>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!reason) return setError("Please select one cancellation reason.");
    if (reason === OTHER_REASON && !details.trim()) return setError("Please tell us the reason.");
    setSaving(true);
    setError("");
    const problem = await onSubmit(reason === OTHER_REASON ? "Other" : reason, details.trim());
    setSaving(false);
    if (problem) setError(problem);
  };

  return (
    <dialog ref={ref} className="crd-dialog" aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }}>
      <form className="crd-box" onSubmit={submit}>
        <button type="button" className="crd-x" aria-label="Close" onClick={onClose}>×</button>
        <h2 id={titleId}>{title}</h2>
        <p className="crd-subject">{subject}</p>
        <fieldset className="crd-reasons">
          <legend>Cancellation reason</legend>
          {[...CANCEL_REASONS, OTHER_REASON].map(r => (
            <label key={r} className={`crd-reason${reason === r ? " is-on" : ""}`}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => { setReason(r); setError(""); }} />
              <span>{r}</span>
            </label>
          ))}
        </fieldset>
        {reason === OTHER_REASON
          ? <label className="crd-text"><span>Write your reason <b>*</b></span><textarea rows={3} maxLength={300} value={details} onChange={e => setDetails(e.target.value)} autoFocus /></label>
          : reason ? <label className="crd-text"><span>Anything we could do better? (optional)</span><textarea rows={2} maxLength={300} value={details} onChange={e => setDetails(e.target.value)} /></label> : null}
        {error && <p className="crd-error" role="alert">{error}</p>}
        <div className="crd-buttons">
          <button type="button" className="crd-close" onClick={onClose}>Close</button>
          <button type="submit" className="crd-submit" disabled={saving}>{saving ? "Please wait…" : request ? "Send cancellation request" : title}</button>
        </div>
      </form>
    </dialog>
  );
}
