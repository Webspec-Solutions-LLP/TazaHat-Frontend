"use server";

import { readCityCookie } from "@/lib/server/city";
import { clearSession, publicUserApi, setSession, userApi, type SessionUser, type TokenPair } from "@/lib/server/session";

/** Customer sign-in, "Notify me" and the notification list. Server actions: the tokens stay in httpOnly cookies, see lib/server/session.ts. */

export interface AppNotification { id: string; title: string; body: string; type: string | null; data: Record<string, string> | null; isRead: boolean; createdAt: string }

/** the signed-in customer, or null (also swaps an old access token for a new one) */
export async function getSessionAction(): Promise<SessionUser | null> {
  const res = await userApi<SessionUser>("/me");
  return res.ok ? res.data : null;
}

export async function requestOtpAction(phone: string): Promise<{ ok: true; resendAfter: number; devCode?: string } | { ok: false; error: string }> {
  if (!/^\d{10}$/.test(phone)) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  const res = await publicUserApi<{ resendAfter: number; devCode?: string }>("/otp/request", { countryCode: "91", phone, channel: "SMS" });
  return res.ok ? { ok: true, resendAfter: res.data.resendAfter, devCode: res.data.devCode } : { ok: false, error: res.message };
}

export async function verifyOtpAction(phone: string, code: string): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  if (!/^\d{10}$/.test(phone) || !/^\d{4}$/.test(code)) return { ok: false, error: "Enter the 4-digit code." };
  const res = await publicUserApi<TokenPair & { user: SessionUser }>("/otp/verify", { countryCode: "91", phone, code });
  if (!res.ok) return { ok: false, error: res.message };
  await setSession({ token: res.data.token, refresh_token: res.data.refresh_token });
  return { ok: true, user: res.data.user };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}

/** the packs this customer is waiting for in the chosen city */
export async function myStockAlertsAction(): Promise<string[]> {
  const city = await readCityCookie();
  if (!city) return [];
  const res = await userApi<{ variantIds: string[] }>(`/stock-alerts?cityId=${encodeURIComponent(city.id)}`);
  return res.ok ? res.data.variantIds : [];
}

export async function notifyMeAction(variantIds: string[]): Promise<{ ok: true; variantIds: string[] } | { ok: false; needsLogin?: boolean; error: string }> {
  const city = await readCityCookie();
  if (!city) return { ok: false, error: "Please choose your delivery city first." };
  const ids = variantIds.filter((v) => typeof v === "string" && v).slice(0, 30);
  if (!ids.length) return { ok: false, error: "Choose a pack first." };
  const res = await userApi<{ variantIds: string[] }>("/stock-alerts", { method: "POST", body: { cityId: city.id, variantIds: ids } });
  return res.ok ? { ok: true, variantIds: res.data.variantIds } : { ok: false, needsLogin: res.status === 401, error: res.message };
}

export async function cancelNotifyMeAction(variantIds: string[]): Promise<{ ok: boolean }> {
  const city = await readCityCookie();
  if (!city || !variantIds.length) return { ok: false };
  const res = await userApi("/stock-alerts/remove", { method: "POST", body: { cityId: city.id, variantIds: variantIds.slice(0, 30) } });
  return { ok: res.ok };
}

export async function notificationsAction(): Promise<{ items: AppNotification[]; unread: number } | null> {
  const res = await userApi<{ items: (Omit<AppNotification, "data"> & { data: unknown })[]; unread: number }>("/notifications?limit=20");
  if (!res.ok) return null;
  return { unread: res.data.unread, items: res.data.items.map((n) => ({ ...n, data: n.data && typeof n.data === "object" ? (n.data as Record<string, string>) : null })) };
}

export interface NotificationCursor { before: string; beforeId: string }

/** One page of the customer's notifications, newest first (10 at a time for the side panel); `next` is the cursor of the page after it. */
export async function notificationsPageAction(cursor?: NotificationCursor | null, limit = 10): Promise<{ items: AppNotification[]; unread: number; hasMore: boolean; next: NotificationCursor | null } | null> {
  const qs = new URLSearchParams({ limit: String(Math.min(50, Math.max(1, Math.floor(limit) || 10))) });
  if (cursor && typeof cursor.before === "string" && typeof cursor.beforeId === "string") { qs.set("before", cursor.before.slice(0, 40)); qs.set("beforeId", cursor.beforeId.slice(0, 60)); }
  const res = await userApi<{ items: (Omit<AppNotification, "data"> & { data: unknown })[]; unread: number; hasMore: boolean; next: NotificationCursor | null }>(`/notifications?${qs}`);
  if (!res.ok) return null;
  return { unread: res.data.unread, hasMore: res.data.hasMore, next: res.data.next, items: res.data.items.map((n) => ({ ...n, data: n.data && typeof n.data === "object" ? (n.data as Record<string, string>) : null })) };
}

export async function markNotificationsReadAction(ids?: string[]): Promise<void> {
  await userApi("/notifications/read", { method: "POST", body: ids?.length ? { ids: ids.slice(0, 100) } : {} });
}

/** the Firebase web config the browser needs for notifications (null while notifications are not set up in the CRM) */
export async function pushConfigAction() {
  const { getPushConfig } = await import("@/lib/server/api");
  const c = await getPushConfig();
  return c.enabled && c.config ? { config: c.config, vapidKey: c.vapidKey ?? null } : null;
}

/** remember this browser as a place to send the customer's notifications */
export async function registerPushTokenAction(token: string): Promise<boolean> {
  if (typeof token !== "string" || token.length < 20 || token.length > 4096) return false;
  const res = await userApi<unknown>("/fcm-token", { method: "POST", body: { token, platform: "WEB" } });
  return res.ok;
}

export async function removePushTokenAction(token: string): Promise<void> {
  if (typeof token !== "string" || !token) return;
  await userApi<unknown>("/fcm-token", { method: "DELETE", body: { token } });
}
