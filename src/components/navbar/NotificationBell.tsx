"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/** "5 min ago" / "3 h ago" / "12 Nov" */
function ago(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** The bell in the header: unread count and the latest notifications of the signed-in customer (shown only when signed in). */
export default function NotificationBell() {
  const { user, notifications, unread, markRead, reloadNotifications } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  if (!user) return null;

  const openItem = (id: string, slug?: string) => {
    setOpen(false);
    void markRead([id]);
    if (slug) router.push(`/${encodeURIComponent(slug)}`);
  };

  return (
    <div className="navbar-notify" ref={box}>
      <button type="button" className="navbar-action-item" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-haspopup="true" aria-expanded={open}
        onClick={() => { setOpen((v) => !v); if (!open) void reloadNotifications(); }}>
        <div className="navbar-action-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          {unread > 0 && <span className="navbar-cart-badge">{unread > 99 ? "99+" : unread}</span>}
        </div>
        <span className="navbar-action-label">Alerts</span>
      </button>
      {open && (
        <div className="navbar-notify-panel" role="dialog" aria-label="Notifications">
          <div className="navbar-notify-head">
            <strong>Notifications</strong>
            {unread > 0 && <button type="button" onClick={() => void markRead()}>Mark all as read</button>}
          </div>
          {notifications.length === 0 ? (
            <p className="navbar-notify-empty">Nothing yet. Tap “Notify me” on a sold-out item and we will tell you here when it is back.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button type="button" className={n.isRead ? "" : "is-unread"} onClick={() => openItem(n.id, n.data?.slug)}>
                    <span className="navbar-notify-title">{n.title}</span>
                    <span className="navbar-notify-body">{n.body}</span>
                    <time dateTime={n.createdAt}>{ago(n.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
