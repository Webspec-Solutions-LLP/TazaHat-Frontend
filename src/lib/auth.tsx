"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Login from "@/components/modals/login/Login";
import NotificationsPanel from "@/components/modals/notifications/NotificationsPanel";
import {
  cancelNotifyMeAction, getSessionAction, logoutAction, markNotificationsReadAction, myStockAlertsAction, notificationsAction, notifyMeAction,
  type AppNotification,
} from "@/app/auth-actions";
import type { SessionUser } from "@/lib/server/session";

/**
 * Who is signed in (customer, phone + OTP), the packs they are waiting for ("Notify me") and their notifications. Everything goes
 * through server actions; the tokens never reach the browser (see lib/server/session.ts).
 */
interface AuthValue {
  user: SessionUser | null;
  /** false until the first answer from the server */
  ready: boolean;
  openLogin: (afterLogin?: () => void) => void;
  logout: () => Promise<void>;
  /** pack ids this customer is waiting for in the chosen city */
  waiting: ReadonlySet<string>;
  /** start waiting for these packs (asks the customer to log in first when needed) */
  requestNotify: (variantIds: string[]) => Promise<void>;
  cancelNotify: (variantIds: string[]) => Promise<void>;
  notifications: AppNotification[];
  unread: number;
  reloadNotifications: () => Promise<void>;
  markRead: (ids?: string[]) => Promise<void>;
  /** opens the side panel with all notifications */
  openNotifications: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const POLL_MS = 60_000;

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [waiting, setWaiting] = useState<ReadonlySet<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const afterLogin = useRef<(() => void) | null>(null);

  const reloadNotifications = useCallback(async () => {
    const data = await notificationsAction();
    if (data) { setNotifications(data.items); setUnread(data.unread); }
  }, []);

  const loadAccount = useCallback(async () => {
    const [ids] = await Promise.all([myStockAlertsAction(), reloadNotifications()]);
    setWaiting(new Set(ids));
  }, [reloadNotifications]);

  useEffect(() => {
    let cancelled = false;
    void getSessionAction().then((u) => {
      if (cancelled) return;
      setUser(u);
      setReady(true);
      if (u) void loadAccount();
    });
    return () => { cancelled = true; };
  }, [loadAccount]);

  // a notification that arrives while the page is open (pushed by the server): into the bell at once, a small card announces it
  const onLive = useCallback((raw: Record<string, unknown>) => {
    if (typeof raw.id !== "string" || typeof raw.title !== "string") return;
    const n: AppNotification = {
      id: raw.id, title: raw.title, body: typeof raw.body === "string" ? raw.body : "", type: typeof raw.type === "string" ? raw.type : null,
      data: raw.data && typeof raw.data === "object" ? (raw.data as Record<string, string>) : null, isRead: false,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    };
    setNotifications((current) => (current.some((x) => x.id === n.id) ? current : [n, ...current].slice(0, 20)));
    setUnread((count) => count + 1);
    setToast(n);
    window.dispatchEvent(new CustomEvent("tazahat:notification", { detail: n })); // the side panel, when it is open, adds it to its list
  }, []);

  // the live stream (Server-Sent Events from this site's own server, which holds the websocket to the backend); the browser reconnects by itself
  useEffect(() => {
    if (!user || typeof EventSource === "undefined") return;
    const source = new EventSource("/api/realtime");
    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { event?: string; notification?: Record<string, unknown>; id?: string; number?: string };
        if (message.event === "notification" && message.notification) onLive(message.notification);
        // an order of this customer changed (the shop updated it, or it was placed elsewhere): My Orders and the open order page read it again
        else if (message.event === "order") window.dispatchEvent(new CustomEvent("tazahat:order-changed", { detail: message }));
        // support chat: a reply, a read receipt or "typing..." from the support team
        else if (message.event === "chat") window.dispatchEvent(new CustomEvent("tazahat:chat", { detail: message }));
      } catch { /* not for us */ }
    };
    return () => { source.close(); setLive(false); };
  }, [user, onLive]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // without the live stream (it could not connect): look again every minute while the tab is open, and when the tab comes back
  useEffect(() => {
    if (!user || live) return;
    const look = () => { if (document.visibilityState === "visible") void reloadNotifications(); };
    const timer = window.setInterval(look, POLL_MS);
    document.addEventListener("visibilitychange", look);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", look); };
  }, [user, live, reloadNotifications]);

  const openLogin = useCallback((after?: () => void) => { afterLogin.current = after ?? null; setLoginOpen(true); }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null); setWaiting(new Set()); setNotifications([]); setUnread(0);
  }, []);

  const doNotify = useCallback(async (variantIds: string[]) => {
    const res = await notifyMeAction(variantIds);
    if (res.ok) setWaiting((current) => new Set([...current, ...res.variantIds]));
  }, []);

  const requestNotify = useCallback(async (variantIds: string[]) => {
    if (user) return doNotify(variantIds);
    openLogin(() => void doNotify(variantIds));
  }, [user, doNotify, openLogin]);

  const cancelNotify = useCallback(async (variantIds: string[]) => {
    const res = await cancelNotifyMeAction(variantIds);
    if (res.ok) setWaiting((current) => new Set([...current].filter((id) => !variantIds.includes(id))));
  }, []);

  const markRead = useCallback(async (ids?: string[]) => {
    await markNotificationsReadAction(ids);
    await reloadNotifications();
  }, [reloadNotifications]);

  const openNotifications = useCallback(() => setNotificationsOpen(true), []);

  const onLoggedIn = useCallback((u: SessionUser) => {
    setUser(u);
    setLoginOpen(false);
    void loadAccount();
    const next = afterLogin.current;
    afterLogin.current = null;
    next?.();
  }, [loadAccount]);

  const value = useMemo<AuthValue>(
    () => ({ user, ready, openLogin, logout, waiting, requestNotify, cancelNotify, notifications, unread, reloadNotifications, markRead, openNotifications }),
    [user, ready, openLogin, logout, waiting, requestNotify, cancelNotify, notifications, unread, reloadNotifications, markRead, openNotifications],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <div className="notif-toast" role="status" aria-live="polite">
          <button type="button" className="notif-toast-body" onClick={() => { setToast(null); setNotificationsOpen(true); }}>
            <span className="notif-toast-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg></span>
            <span><strong>{toast.title}</strong><small>{toast.body}</small></span>
          </button>
          <button type="button" className="notif-toast-close" aria-label="Dismiss" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      {notificationsOpen && user && <NotificationsPanel unread={unread} onClose={() => setNotificationsOpen(false)} onChanged={() => void reloadNotifications()} />}
      {loginOpen && <Login onClose={() => { afterLogin.current = null; setLoginOpen(false); }} onLoggedIn={onLoggedIn} />}
    </AuthContext.Provider>
  );
}
