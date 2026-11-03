"use server";

import { userApi } from "@/lib/server/session";

/** Support chat of the signed-in customer (server actions: the login tokens stay in httpOnly cookies). */
export interface ChatMsg {
  id: string; threadId: string; text: string; fromSupport: boolean; createdAt: string; readAt: string | null; clientId: string | null; imageUrl: string | null;
  voiceUrl: string | null; voiceSeconds: number | null; transcript: string | null; waveform: number[];
  /** written as a support ticket ("Create ticket") */
  ticket?: boolean;
  /** the old system's pictures / recordings: the file is gone, a "not available" card is shown */
  legacyMedia: "image" | "voice" | "video" | "document" | null;
}
export interface ChatMedia { imageUrl?: string; voiceUrl?: string; voiceSeconds?: number; transcript?: string; waveform?: number[] }
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

export async function chatSendAction(text: string, clientId: string, media?: ChatMedia, ticket = false): Promise<Result<ChatMsg>> {
  const res = await userApi<{ message: ChatMsg }>("/chat/messages", {
    method: "POST",
    body: { text: String(text).slice(0, 2000), clientId: String(clientId).slice(0, 60), ...(ticket ? { ticket: true } : {}), ...(media?.imageUrl ? { imageUrl: String(media.imageUrl).slice(0, 200) } : {}), ...(media?.voiceUrl ? { voiceUrl: String(media.voiceUrl).slice(0, 200), voiceSeconds: Math.min(60, Math.max(1, Math.round(Number(media.voiceSeconds) || 1))), transcript: String(media.transcript ?? "").slice(0, 3000), waveform: (media.waveform ?? []).slice(0, 64).map((n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))) } : {}) },
  });
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
