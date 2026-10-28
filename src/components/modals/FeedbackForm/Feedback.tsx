"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import "./Feedback.css";

interface FeedbackProps {
  onClose: () => void;
}

const topics = ["Product quality", "Delivery", "Website experience", "Customer support", "Other"];

export default function Feedback({ onClose }: FeedbackProps) {
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
      <section className="feedback-sidebar-panel">
        <header className="feedback-sidebar-header">
          <button className="feedback-sidebar-close" type="button" aria-label="Close feedback form" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <div><h2 id={titleId}>{submitted ? "Thank You" : "Share Your Feedback"}</h2><p>{submitted ? "Your voice helps us improve" : "We’d love to hear about your experience"}</p></div>
        </header>

        {submitted ? (
          <div className="feedback-sidebar-success" role="status">
            <span className="feedback-sidebar-success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span>
            <h3>Feedback received</h3>
            <p>Thanks for helping us make TazaHaat better.</p>
            <button type="button" onClick={close}>Done</button>
          </div>
        ) : (
          <form className="feedback-sidebar-form" onSubmit={submit}>
            <div className="feedback-sidebar-fields">
              <section className="feedback-rating-field" aria-labelledby={`${titleId}-rating`}>
                <h3 id={`${titleId}-rating`}>How would you rate us?</h3>
                <div className="feedback-sidebar-rating" role="group" aria-label="Rate your experience">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button key={value} type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value} onClick={() => setRating(value)}>
                      {value <= rating ? "\u2605" : "\u2606"}
                    </button>
                  ))}
                </div>
              </section>

              <label className="feedback-sidebar-field">
                <span>What is your feedback about? <b>*</b></span>
                <select required value={topic} onChange={event => setTopic(event.target.value)}>
                  <option value="" disabled>Select a topic</option>
                  {topics.map(item => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>

              <label className="feedback-sidebar-field" htmlFor={messageId}>
                <span>Your comments <b>*</b></span>
                <textarea id={messageId} required rows={5} maxLength={1000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Tell us what went well or what we can improve..." />
                <small>{message.length}/1000 characters</small>
              </label>

              <label className="feedback-sidebar-field">
                <span>Email address <small>(optional, if you’d like a reply)</small></span>
                <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" />
              </label>
            </div>

            <footer className="feedback-sidebar-footer">
              <button type="button" className="feedback-cancel-button" onClick={close}>Cancel</button>
              <button type="submit" className="feedback-submit-button" disabled={rating === 0}>SEND FEEDBACK</button>
            </footer>
          </form>
        )}
      </section>
    </dialog>
  );
}
