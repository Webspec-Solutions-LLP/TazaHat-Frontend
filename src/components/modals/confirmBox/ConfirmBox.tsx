"use client";

import "./ConfirmBox.css";

export interface ConfirmConfig {
  title: string;
  text: string;
  /** a picture the question is about (the new profile photo) */
  preview?: string;
  yes?: string;
  no?: string;
}

/** A question with Yes / No, in the style of the old shop's "Confirmation Message!" pop-up. The caller shows it and answers on its own. */
export default function ConfirmBox({ config, onAnswer }: { config: ConfirmConfig; onAnswer: (yes: boolean) => void }) {
  return (
    <div className="confirm-box-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="confirm-box-title" onKeyDown={(e) => { if (e.key === "Escape") onAnswer(false); }}>
      <div className="confirm-box">
        {config.preview
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="confirm-box-preview" src={config.preview} alt="" />
          : <span className="confirm-box-icon" aria-hidden="true">i</span>}
        <h3 id="confirm-box-title">{config.title}</h3>
        <p>{config.text}</p>
        <div className="confirm-box-buttons">
          <button type="button" className="confirm-box-yes" autoFocus onClick={() => onAnswer(true)}>{config.yes ?? "Yes"}</button>
          <button type="button" className="confirm-box-no" onClick={() => onAnswer(false)}>{config.no ?? "No"}</button>
        </div>
      </div>
    </div>
  );
}
