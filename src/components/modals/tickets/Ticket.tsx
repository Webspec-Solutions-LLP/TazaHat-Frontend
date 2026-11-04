"use client";

import { useBackClose } from "@/lib/backLayers";
import { useEffect, useId, useRef, useState } from "react";
import { chatOlderAction, chatOpenAction, type ChatMsg } from "@/app/chat-actions";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "@/app/(frontend)/profile/english.json";
import bengaliText from "@/app/(frontend)/profile/bengali.json";
import hindiText from "@/app/(frontend)/profile/hindi.json";
import "./Ticket.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface TicketProps {
  onClose: () => void;
  onNewTicket: () => void;
}

function TicketIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function Ticket({ onClose, onNewTicket }: TicketProps) {
  const [language] = useLanguage();
  const t = textMap[language] || englishText;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openNewTicketAfterClose = useRef(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
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
    let active = true;
    void chatOpenAction().then((result) => {
      if (!active) return;
      if (result.ok) {
        setMessages(result.data.messages);
        setHasMore(result.data.hasMore);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    if (!closing) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      onClose();
      if (openNewTicketAfterClose.current) onNewTicket();
    }, reducedMotion ? 0 : 460);
    return () => window.clearTimeout(timer);
  }, [closing, onClose, onNewTicket]);

  const close = () => setClosing(true);
  useBackClose(close);

  const loadOlder = async () => {
    const first = messages[0];
    if (!first || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    setError("");
    const result = await chatOlderAction({ createdAt: first.createdAt, id: first.id });
    if (result.ok) {
      setMessages((current) => [...result.data.messages, ...current]);
      setHasMore(result.data.hasMore);
    } else {
      setError(result.error);
    }
    setLoadingOlder(false);
  };

  const tickets = messages.flatMap((message, index) => {
    if (!message.ticket || message.fromSupport) return [];
    const nextTicketIndex = messages.findIndex((item, itemIndex) => itemIndex > index && item.ticket && !item.fromSupport);
    const end = nextTicketIndex < 0 ? messages.length : nextTicketIndex;
    const hasReply = messages.slice(index + 1, end).some((item) => item.fromSupport);
    return [{ message, hasReply }];
  });

  const formatDate = (value: string) => new Intl.DateTimeFormat(t.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

  return (
    <dialog
      ref={dialogRef}
      className={`tickets-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="tickets-panel" lang={t.language}>
        <header className="tickets-header">
          <button className="tickets-close" type="button" aria-label={t.closeTicketsAria} onClick={close}>
            <TicketIcon><path d="m15 18-6-6 6-6" /></TicketIcon>
          </button>
          <div className="tickets-title">
            <h2 id={titleId}>{t.ticketsTitle}</h2>
            <p>{t.ticketsDescription}</p>
          </div>
          <button
            className="tickets-new"
            type="button"
            onClick={() => {
              openNewTicketAfterClose.current = true;
              close();
            }}
          >
            <TicketIcon><path d="M12 5v14m-7-7h14" /></TicketIcon>
            {t.newTicket}
          </button>
        </header>

        <div className="tickets-list">
          {loading && Array.from({ length: 2 }, (_, index) => (
            <div className="tickets-skeleton sk" key={index} aria-hidden="true" />
          ))}
          {error && (
            <p className="tickets-error" role="alert">
              {error}
              {!loading && messages.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setReload((count) => count + 1);
                  }}
                >
                  {t.tryAgain}
                </button>
              )}
            </p>
          )}
          {!loading && tickets.length === 0 && !error && (
            <p className="tickets-empty">{hasMore ? t.noRecentTickets : t.noTickets}</p>
          )}
          {tickets.map(({ message, hasReply }) => (
            <article className="tickets-card" key={message.id}>
              <div className="tickets-card-meta">
                <time dateTime={message.createdAt}><span aria-hidden="true">🎫</span> {formatDate(message.createdAt)}</time>
                <span className={`tickets-status${hasReply ? " is-replied" : ""}`}>{hasReply ? t.ticketReplied : t.ticketWaiting}</span>
              </div>
              <p>{message.text || message.transcript || t.ticketAttachment}</p>
            </article>
          ))}
          {!loading && hasMore && (
            <button className="tickets-older" type="button" onClick={() => void loadOlder()} disabled={loadingOlder}>
              {loadingOlder ? t.loadingTickets : error ? t.tryAgain : t.olderTickets}
            </button>
          )}
        </div>
      </section>
    </dialog>
  );
}