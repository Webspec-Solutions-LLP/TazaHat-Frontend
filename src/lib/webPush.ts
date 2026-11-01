"use client";

import { pushConfigAction, registerPushTokenAction, removePushTokenAction } from "@/app/auth-actions";

/** Browser notifications for the signed-in customer (Firebase Cloud Messaging): turn on / off for this browser. */
const TOKEN_KEY = "tazahat-push-token";

export const pushSupported = () =>
  typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
export const pushPermission = (): NotificationPermission | "unsupported" => (pushSupported() ? Notification.permission : "unsupported");
const savedToken = () => { try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const pushIsOn = () => pushSupported() && Notification.permission === "granted" && !!savedToken();

async function fetchToken(): Promise<string | null> {
  const setup = await pushConfigAction();
  if (!setup) return null;
  const [{ initializeApp, getApps, getApp }, { getMessaging, getToken }] = await Promise.all([import("firebase/app"), import("firebase/messaging")]);
  const app = getApps().length ? getApp() : initializeApp({ ...setup.config, authDomain: setup.config.authDomain ?? undefined });
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { ...(setup.vapidKey ? { vapidKey: setup.vapidKey } : {}), serviceWorkerRegistration: registration });
  return token || null;
}

/** ask the browser for permission (call it from a click), get this browser's token and give it to the server */
export async function enablePush(): Promise<{ ok: true } | { ok: false; reason: "unsupported" | "denied" | "not-set-up" | "failed" }> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };
  try {
    const token = await fetchToken();
    if (!token) return { ok: false, reason: "not-set-up" };
    if (!(await registerPushTokenAction(token))) return { ok: false, reason: "failed" };
    try { window.localStorage.setItem(TOKEN_KEY, token); } catch { /* the token is still registered */ }
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export async function disablePush(): Promise<void> {
  const token = savedToken();
  try { window.localStorage.removeItem(TOKEN_KEY); } catch { /* nothing saved */ }
  if (token) await removePushTokenAction(token);
}

/** after signing in on a browser that already allowed notifications: make sure this customer owns this browser's token */
export async function syncPush(): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    const token = await fetchToken();
    if (token && (await registerPushTokenAction(token))) window.localStorage.setItem(TOKEN_KEY, token);
  } catch { /* try again next time */ }
}
