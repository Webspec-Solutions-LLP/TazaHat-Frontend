"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsReadAction, notificationsPageAction, type AppNotification, type NotificationCursor } from "@/app/auth-actions";
import { useBackClose } from "@/lib/backLayers";
import { timeAgo } from "@/lib/timeAgo";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "../notifications/english.json";
import bengaliText from "../notifications/bengali.json";
import hindiText from "../notifications/hindi.json";
import "./Notification.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

interface NotificationProps {
  unread: number;
  onClose: () => void;
  onChanged: () => void;
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h8l4 4V20H6z" />
      <path d="M14 3.5V8h4M9 12h6m-6 3h6" />
    </svg>
  );
}

export default function Notification({ unread, onClose, onChanged }: NotificationProps) {
  const [language] = useLanguage();
  const t = textMap[language] || englishText;
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<NotificationCursor | null>(null);
  const busyRef = useRef(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [marking, setMarking] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => setClosing(true), []);
  useBackClose(close);

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
    const timer = window.setTimeout(
      onClose,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320,
    );
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoading(true);
    setFailed(false);
    const page = await notificationsPageAction(cursorRef.current, 10);
    if (!page) {
      setFailed(true);
    } else {
      cursorRef.current = page.next;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setHasMore(page.hasMore);
    }
    setLoading(false);
    busyRef.current = false;
  }, [hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { root: listRef.current, rootMargin: "160px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, failed, items.length]);

  useEffect(() => {
    const onLive = (event: Event) => {
      const notification = (event as CustomEvent<AppNotification>).detail;
      setItems((current) => current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current]);
    };
    window.addEventListener("tazahat:notification", onLive);
    return () => window.removeEventListener("tazahat:notification", onLive);
  }, []);

  const markAll = async () => {
    if (marking || unread === 0) return;
    setMarking(true);
    await markNotificationsReadAction();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    onChanged();
    setMarking(false);
  };

  const openItem = async (item: AppNotification) => {
    if (!item.isRead) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
      void markNotificationsReadAction([item.id]).then(onChanged);
    }
    if (item.data?.orderNumber) {
      close();
      router.push(`/orders/${encodeURIComponent(item.data.orderNumber)}`);
    } else if (item.data?.slug) {
      close();
      router.push(`/${encodeURIComponent(item.data.slug)}`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`notification-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby="notification-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="notification-panel" lang={t.language}>
        <header className="notification-header">
          <button type="button" className="notification-back" onClick={close} aria-label={t.closeAria}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <h2 id="notification-title">{t.title}</h2>
          <button
            type="button"
            className="notification-mark-all"
            onClick={() => void markAll()}
            disabled={marking || unread === 0}
          >
            {marking ? t.marking : t.markAllRead}
          </button>
        </header>

        <div className="notification-list" ref={listRef}>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`notification-item${item.isRead ? "" : " is-unread"}`}
              onClick={() => void openItem(item)}
            >
              <span className="notification-icon"><NotificationIcon /></span>
              <span className="notification-copy">
                <strong>{item.title}</strong>
                <span>{item.body}</span>
                <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
              </span>
            </button>
          ))}
          {loading && Array.from({ length: items.length ? 2 : 5 }, (_, index) => (
            <div className="notification-skeleton" key={index} role="status" aria-label={t.loadingAria}>
              <span className="sk" /><span className="sk" /><span className="sk" />
            </div>
          ))}
          {failed && (
            <p className="notification-note" role="alert">
              {t.loadFailed} <button type="button" onClick={() => void loadMore()}>{t.tryAgain}</button>
            </p>
          )}
          {!loading && !failed && items.length === 0 && !hasMore && (
            <p className="notification-note">{t.emptyNotice}</p>
          )}
          {!hasMore && items.length > 0 && <p className="notification-note">{t.endOfList}</p>}
          {hasMore && !failed && <div ref={sentinelRef} className="notification-sentinel" aria-hidden="true" />}
        </div>
      </section>
    </dialog>
  );
}
