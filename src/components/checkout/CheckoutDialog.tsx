"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import "./CheckoutDialog.css";

/** The old checkout's pop-ups (SweetAlert): an icon, a title, a text and 2-3 buttons. A choice has to be made: Escape and a click outside do nothing. */
export interface DialogButton { label: string; tone: "primary" | "success" | "danger" | "plain"; onClick: () => void }
export interface DialogSpec { title: string; icon: "warning" | "info" | "success"; body: ReactNode; buttons: DialogButton[]; onClose?: () => void }

export default function CheckoutDialog({ spec, onDismiss }: { spec: DialogSpec; onDismiss: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const symbol = spec.icon === "success" ? "✓" : spec.icon === "warning" ? "!" : "i";
  return (
    <dialog ref={ref} className="cd-dialog" aria-labelledby={titleId} onCancel={e => e.preventDefault()}>
      <div className="cd-box">
        {spec.onClose && <button type="button" className="cd-close" aria-label="Close" onClick={() => { onDismiss(); spec.onClose?.(); }}>×</button>}
        <div className={`cd-icon is-${spec.icon}`} aria-hidden="true">{symbol}</div>
        <h2 id={titleId}>{spec.title}</h2>
        <div className="cd-body">{spec.body}</div>
        <div className="cd-buttons">
          {spec.buttons.map(b => <button key={b.label} type="button" className={`cd-btn is-${b.tone}`} onClick={() => { onDismiss(); b.onClick(); }}>{b.label}</button>)}
        </div>
      </div>
    </dialog>
  );
}
