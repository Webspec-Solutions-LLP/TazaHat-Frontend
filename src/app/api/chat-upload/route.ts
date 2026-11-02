import { currentAccessToken } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** Pictures and voice recordings of the support chat: browser -> here (login cookie) -> API (bearer). The browser never sees the token. */
export async function POST(request: Request) {
  const token = await currentAccessToken();
  if (!token) return Response.json({ status: "error", message: "Please log in." }, { status: 401 });
  const kind = new URL(request.url).searchParams.get("kind") === "voice" ? "voice" : "image";
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!/^(image|audio|video)\//.test(type)) return Response.json({ status: "error", message: "This file type is not allowed." }, { status: 415 });
  const body = await request.arrayBuffer();
  if (body.byteLength > 10 * 1024 * 1024) return Response.json({ status: "error", message: "The file is too big." }, { status: 413 });
  const res = await fetch(`${API_BASE}/api/user/chat/upload?kind=${kind}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": type }, body, cache: "no-store" });
  return new Response(await res.text(), { status: res.status, headers: { "content-type": "application/json" } });
}
