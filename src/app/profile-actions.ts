"use server";

import { userApi, type SessionUser } from "@/lib/server/session";

/** The customer's own details (name, e-mail). The phone number is what they sign in with and stays as it is. */
export async function updateProfileAction(input: { name: string; email: string }): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const res = await userApi<SessionUser>("/me", { method: "PATCH", body: { name: input.name.trim(), email: input.email.trim() } });
  return res.ok ? { ok: true, user: res.data } : { ok: false, error: res.message };
}
