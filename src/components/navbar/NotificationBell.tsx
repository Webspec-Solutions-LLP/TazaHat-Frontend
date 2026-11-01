"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/timeAgo";
import { disablePush, enablePush, pushIsOn, pushPermission, syncPush } from "@/lib/webPush";

/** The bell in the header: unread count and the latest notifications of the signed-in customer (shown only when signed in). */
export default function NotificationBell() {
  const { user, notifications, unread, markRead, reloadNotifications, openNotifications } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // browser notifications of this device: on / off / blocked, and the answer to the last tap
  const [push, setPush] = useState<"unsupported" | "off" | "on" | "blocked">("unsupported");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState("");
  const readPush = () => { const p = pushPermission(); setPush(p === "unsupported" ? "unsupported" : p === "denied" ? "blocked" : pushIsOn() ? "on" : "off"); };
  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    readPush();
    // a browser that already allowed notifications keeps working for whoever signs in on it
    void syncPush().then(readPush);
  }, [signedIn]);
  const togglePush = async () => {
    setPushBusy(true);
    setPushNote("");
    if (push === "on") { await disablePush(); readPush(); }
    else {
      const res = await enablePush();
      if (!res.ok) setPushNote(res.reason === "denied" ? "Notifications are blocked for this site. Allow them in your browser's site settings." : res.reason === "not-set-up" ? "Browser notifications are not switched on yet." : "We could not turn notifications on. Please try again.");
      readPush();
    }
    setPushBusy(false);
  };

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  if (!user) return null;

  const openItem = (id: string, slug?: string, order?: string) => {
    setOpen(false);
    void markRead([id]);
    if (order) router.push(`/orders/${encodeURIComponent(order)}`);
    else if (slug) router.push(`/${encodeURIComponent(slug)}`);
  };

  return (
    <div className="navbar-notify" ref={box}>
      <button type="button" className="navbar-action-item" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-haspopup="true" aria-expanded={open}
        onClick={() => { setOpen((v) => !v); if (!open) void reloadNotifications(); }}>
        <div className="navbar-action-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          {unread > 0 && <span className="navbar-cart-badge">{unread > 99 ? "99+" : unread}</span>}
        </div>
        <span className="navbar-action-label navbar-bell-label">Alerts</span>
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
            <ul className="navbar-notify-list">
              {notifications.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <button type="button" className={n.isRead ? "" : "is-unread"} onClick={() => openItem(n.id, n.data?.slug, n.data?.orderNumber)}>
                    <span className="navbar-notify-title">{n.title}</span>
                    <span className="navbar-notify-body">{n.body}</span>
                    <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {push !== "unsupported" && (
            <div className="navbar-notify-push">
              <span>{push === "on" ? "Notifications are on for this device." : push === "blocked" ? "Notifications are blocked in this browser." : "Get notified on this device, even when the site is closed."}</span>
              {push !== "blocked" && <button type="button" disabled={pushBusy} onClick={() => void togglePush()}>{pushBusy ? "…" : push === "on" ? "Turn off" : "Turn on"}</button>}
              {pushNote && <small role="status">{pushNote}</small>}
            </div>
          )}
          <button type="button" className="navbar-notify-viewall" onClick={() => { setOpen(false); openNotifications(); }}>View all notifications</button>
        </div>
      )}
    </div>
  );
}
