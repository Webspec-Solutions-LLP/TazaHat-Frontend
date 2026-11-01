"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsReadAction, notificationsPageAction, type AppNotification, type NotificationCursor } from "@/app/auth-actions";
import { useBackClose } from "@/lib/backLayers";
import { timeAgo } from "@/lib/timeAgo";
import "./NotificationsPanel.css";

/**
 * All of the customer's notifications in a side panel: 10 at a time, the next 10 load as the list is scrolled to its end.
 * "Mark all as read" marks every notification (not only the ones loaded). Opened by "View all" in the bell's popup.
 */
export default function NotificationsPanel({ unread, onClose, onChanged }: { unread: number; onClose: () => void; onChanged: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [marking, setMarking] = useState(false);
  const [closing, setClosing] = useState(false);
  const cursor = useRef<NotificationCursor | null>(null);
  const busy = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setClosing(true), []);
  useBackClose(close);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, [close]);

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    const page = await notificationsPageAction(cursor.current, 10);
    if (!page) setFailed(true);
    else {
      cursor.current = page.next;
      setItems((current) => {
        const seen = new Set(current.map((n) => n.id));
        return [...current, ...page.items.filter((n) => !seen.has(n.id))];
      });
      setHasMore(page.hasMore);
    }
    setLoading(false);
    busy.current = false;
  }, []);

  // the first 10, then the next 10 whenever the end of the list comes into view
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) void loadMore(); }, { root: list.current, rootMargin: "240px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, failed, items.length]);

  // a notification pushed by the server while the panel is open goes to the top of the list
  useEffect(() => {
    const onLive = (event: Event) => {
      const n = (event as CustomEvent<AppNotification>).detail;
      setItems((current) => (current.some((x) => x.id === n.id) ? current : [n, ...current]));
    };
    window.addEventListener("tazahat:notification", onLive);
    return () => window.removeEventListener("tazahat:notification", onLive);
  }, []);

  const markAll = async () => {
    if (marking) return;
    setMarking(true);
    await markNotificationsReadAction();
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    onChanged();
    setMarking(false);
  };

  const open = async (n: AppNotification) => {
    if (!n.isRead) {
      setItems((current) => current.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      void markNotificationsReadAction([n.id]).then(onChanged);
    }
    if (n.data?.slug) { close(); router.push(`/${encodeURIComponent(n.data.slug)}`); }
  };

  return (
    <div className={`notif-backdrop${closing ? " is-closing" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside className="notif-panel" role="dialog" aria-modal="true" aria-labelledby="notif-title">
        <header className="notif-head">
          <div><h2 id="notif-title">Notifications</h2><p>{unread > 0 ? `${unread > 99 ? "99+" : unread} unread` : "You are all caught up"}</p></div>
          <div className="notif-head-actions">
            <button type="button" className="notif-markall" onClick={() => void markAll()} disabled={marking || unread === 0}>{marking ? "Marking…" : "Mark all as read"}</button>
            <button type="button" className="notif-close" onClick={close} aria-label="Close notifications">×</button>
          </div>
        </header>
        <div className="notif-list" ref={list}>
          {items.map((n) => (
            <button type="button" key={n.id} className={`notif-item${n.isRead ? "" : " is-unread"}`} onClick={() => void open(n)}>
              <span className="notif-dot" aria-hidden="true" />
              <span className="notif-copy"><strong>{n.title}</strong><span>{n.body}</span><time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time></span>
            </button>
          ))}
          {loading && Array.from({ length: items.length ? 2 : 6 }, (_, i) => <div className="notif-skeleton" key={i} role="status" aria-label="Loading notifications"><span className="sk" /><span className="sk" /><span className="sk" /></div>)}
          {failed && <p className="notif-note" role="alert">We could not load notifications. <button type="button" onClick={() => void loadMore()}>Try again</button></p>}
          {!loading && !failed && items.length === 0 && !hasMore && <p className="notif-note">No notifications yet. Tap “Notify me” on a sold out item and we will tell you here when it is back.</p>}
          {!hasMore && items.length > 0 && <p className="notif-note">That is everything.</p>}
          {hasMore && !failed && <div ref={sentinel} className="notif-sentinel" aria-hidden="true" />}
        </div>
      </aside>
    </div>
  );
}
