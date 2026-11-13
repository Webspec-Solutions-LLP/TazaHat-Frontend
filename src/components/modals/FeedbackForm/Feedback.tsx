"use client";

import { useBackClose } from "@/lib/backLayers";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import "./Feedback.css";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishTextRaw from "./english.json";
import bengaliTextRaw from "./bengali.json";
import hindiTextRaw from "./hindi.json";
import { brandify } from "@/lib/brandText";
const englishText = brandify(englishTextRaw);
const bengaliText = brandify(bengaliTextRaw);
const hindiText = brandify(hindiTextRaw);

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface FeedbackProps {
  onClose: () => void;
}

export default function Feedback({ onClose }: FeedbackProps) {
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [closing, setClosing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const titleId = useId();
  const messageId = useId();

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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onClose, reduceMotion ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const close = () => setClosing(true);
  useBackClose(close);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className={`feedback-sidebar-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
    >
      <section className="feedback-sidebar-panel" lang={t.language}>
        <header className="feedback-sidebar-header">
          <button className="feedback-sidebar-close" type="button" aria-label={t.closeAria} onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <div>
            <h2 id={titleId}>{submitted ? t.titleThankYou : t.titleShare}</h2>
            <p>{submitted ? t.subtitleThankYou : t.subtitleShare}</p>
          </div>
        </header>

        {submitted ? (
          <div className="feedback-sidebar-success" role="status">
            <span className="feedback-sidebar-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span>
            <h3>{t.successTitle}</h3>
            <p>{t.successMessage}</p>
            <button type="button" onClick={close}>{t.doneButton}</button>
          </div>
        ) : (
          <form className="feedback-sidebar-form" onSubmit={submit}>
            <div className="feedback-sidebar-fields">
              <section className="feedback-rating-field" aria-labelledby={`${titleId}-rating`}>
                <h3 id={`${titleId}-rating`}>{t.ratingHeading}</h3>
                <div className="feedback-sidebar-rating" role="group" aria-label={t.ratingGroupAria}>
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      type="button"
                      aria-label={t.starAria.replace("{count}", String(value)).replace("{star}", value === 1 ? t.starSingle : t.starPlural)}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                    >
                      {value <= rating ? "\u2605" : "\u2606"}
                    </button>
                  ))}
                </div>
              </section>

              <label className="feedback-sidebar-field">
                <span>{t.topicLabel} <b>*</b></span>
                <select required value={topic} onChange={event => setTopic(event.target.value)}>
                  <option value="" disabled>{t.selectTopicPlaceholder}</option>
                  {t.topics.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
                </select>
              </label>

              <label className="feedback-sidebar-field" htmlFor={messageId}>
                <span>{t.commentsLabel} <b>*</b></span>
                <textarea
                  id={messageId}
                  required
                  rows={5}
                  maxLength={1000}
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder={t.commentsPlaceholder}
                />
                <small>{t.charCount.replace("{count}", String(message.length))}</small>
              </label>

              <label className="feedback-sidebar-field">
                <span>{t.emailLabel} <small>{t.emailOptional}</small></span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder={t.emailPlaceholder}
                />
              </label>
            </div>

            <footer className="feedback-sidebar-footer">
              <button type="button" className="feedback-cancel-button" onClick={close}>{t.cancelButton}</button>
              <button type="submit" className="feedback-submit-button" disabled={rating === 0}>{t.sendFeedbackButton}</button>
            </footer>
          </form>
        )}
      </section>
    </dialog>
  );
}
