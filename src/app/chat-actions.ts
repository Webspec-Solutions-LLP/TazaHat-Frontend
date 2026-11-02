"use server";

import { userApi } from "@/lib/server/session";

/** Support chat of the signed-in customer (server actions: the login tokens stay in httpOnly cookies). */
export interface ChatMsg { id: string; threadId: string; text: string; fromSupport: boolean; createdAt: string; readAt: string | null; clientId: string | null; imageUrl: string | null }
export interface ChatOpen { threadId: string; messages: ChatMsg[]; hasMore: boolean; unread: number }
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** opens the chat: the latest 20 messages */
export async function chatOpenAction(): Promise<Result<ChatOpen>> {
  const res = await userApi<ChatOpen>("/chat");
  return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.message };
}

/** scrolling up: 10 messages older than the oldest one on screen */
export async function chatOlderAction(before: { createdAt: string; id: string }): Promise<Result<{ messages: ChatMsg[]; hasMore: boolean }>> {
  const qs = new URLSearchParams({ before: String(before.createdAt).slice(0, 40), beforeId: String(before.id).slice(0, 60), limit: "10" });
  const res = await userApi<{ messages: ChatMsg[]; hasMore: boolean }>(`/chat/messages?${qs}`);
  return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.message };
}

export async function chatSendAction(text: string, clientId: string): Promise<Result<ChatMsg>> {
  const res = await userApi<{ message: ChatMsg }>("/chat/messages", { method: "POST", body: { text: String(text).slice(0, 2000), clientId: String(clientId).slice(0, 60) } });
  return res.ok ? { ok: true, data: res.data.message } : { ok: false, error: res.message };
}

export async function chatReadAction(): Promise<void> {
  await userApi<unknown>("/chat/read", { method: "POST", body: {} });
}

export async function chatTypingAction(on: boolean): Promise<void> {
  await userApi<unknown>("/chat/typing", { method: "POST", body: { on: !!on } });
}

/** the unread count for the little badge on the chat button */
export async function chatUnreadAction(): Promise<number> {
  const res = await userApi<{ unread: number }>("/chat");
  return res.ok ? res.data.unread : 0;
}
