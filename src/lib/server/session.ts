import "server-only";
import { cookies } from "next/headers";

/**
 * The signed-in customer. The two tokens live in httpOnly cookies, so the browser's JavaScript never sees them (and nothing shows in
 * the Network tab): only server actions read them and call the backend. The access token is short lived (30 minutes), the refresh
 * token lasts 30 days and is swapped for a fresh pair when the access token has run out.
 */
const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const ACCESS = "tazahat_at";
const REFRESH = "tazahat_rt";
const secure = process.env.NODE_ENV === "production";

export interface SessionUser { id: string; name: string; phone: string | null; email: string | null; avatarUrl: string | null }
export interface TokenPair { token: string; refresh_token: string }

export async function setSession(tokens: TokenPair) {
  const jar = await cookies();
  jar.set(ACCESS, tokens.token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 25 });
  jar.set(REFRESH, tokens.refresh_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

/** swaps the refresh token for a new pair (the old one stops working); null when there is none or it is no longer valid */
async function refresh(): Promise<string | null> {
  const jar = await cookies();
  const old = jar.get(REFRESH)?.value;
  if (!old) return null;
  const res = await fetch(`${API_BASE}/api/user/refresh-token`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: old }), cache: "no-store" }).catch(() => null);
  const json = res ? ((await res.json().catch(() => null)) as { data?: Partial<TokenPair> } | null) : null;
  if (!res?.ok || !json?.data?.token || !json.data.refresh_token) {
    await clearSession();
    return null;
  }
  await setSession({ token: json.data.token, refresh_token: json.data.refresh_token });
  return json.data.token;
}

/** the customer's access token (the cookie, or a fresh one from the refresh token); null when nobody is signed in. For route handlers and server actions. */
export async function currentAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS)?.value ?? (await refresh());
}

export type UserCall<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

/** a call to the backend as the signed-in customer (refreshes the tokens once when needed). Use it from server actions only. */
export async function userApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<UserCall<T>> {
  const jar = await cookies();
  let token = jar.get(ACCESS)?.value ?? (await refresh());
  if (!token) return { ok: false, status: 401, message: "Please log in." };
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${API_BASE}/api/user${path}`, {
      method: init.method ?? "GET",
      headers: { authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "content-type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    }).catch(() => null);
    if (!res) return { ok: false, status: 503, message: "Could not reach the server. Please try again." };
    if (res.status === 401 && attempt === 0) {
      const next = await refresh();
      if (!next) return { ok: false, status: 401, message: "Please log in." };
      token = next;
      continue;
    }
    const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: T } | null;
    if (!res.ok || json?.status !== "success") return { ok: false, status: res.status, message: json?.message ?? "Something went wrong. Please try again." };
    return { ok: true, data: json.data as T };
  }
  return { ok: false, status: 401, message: "Please log in." };
}

/** a call that needs no login (the OTP step); the answer is handed back untouched */
export async function publicUserApi<T>(path: string, body: unknown): Promise<UserCall<T>> {
  const res = await fetch(`${API_BASE}/api/user${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }).catch(() => null);
  if (!res) return { ok: false, status: 503, message: "Could not reach the server. Please try again." };
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: T } | null;
  if (!res.ok || json?.status !== "success") return { ok: false, status: res.status, message: json?.message ?? "Something went wrong. Please try again." };
  return { ok: true, data: json.data as T };
}
