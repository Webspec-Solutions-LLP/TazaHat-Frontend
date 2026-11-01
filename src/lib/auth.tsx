"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Login from "@/components/modals/login/Login";
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
  const [waiting, setWaiting] = useState<ReadonlySet<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
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

  // new notifications show up without a reload: look again every minute while the tab is open, and when the tab comes back
  useEffect(() => {
    if (!user) return;
    const look = () => { if (document.visibilityState === "visible") void reloadNotifications(); };
    const timer = window.setInterval(look, POLL_MS);
    document.addEventListener("visibilitychange", look);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", look); };
  }, [user, reloadNotifications]);

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

  const onLoggedIn = useCallback((u: SessionUser) => {
    setUser(u);
    setLoginOpen(false);
    void loadAccount();
    const next = afterLogin.current;
    afterLogin.current = null;
    next?.();
  }, [loadAccount]);

  const value = useMemo<AuthValue>(
    () => ({ user, ready, openLogin, logout, waiting, requestNotify, cancelNotify, notifications, unread, reloadNotifications, markRead }),
    [user, ready, openLogin, logout, waiting, requestNotify, cancelNotify, notifications, unread, reloadNotifications, markRead],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loginOpen && <Login onClose={() => { afterLogin.current = null; setLoginOpen(false); }} onLoggedIn={onLoggedIn} />}
    </AuthContext.Provider>
  );
}
