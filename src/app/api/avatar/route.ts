import { currentAccessToken } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** The profile picture: browser -> here (login cookie) -> API (bearer). The browser never sees the token. */
export async function POST(request: Request) {
  const token = await currentAccessToken();
  if (!token) return Response.json({ status: "error", message: "Please log in." }, { status: 401 });
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!/^image\//.test(type)) return Response.json({ status: "error", message: "Choose a picture." }, { status: 415 });
  const body = await request.arrayBuffer();
  if (body.byteLength > 8 * 1024 * 1024) return Response.json({ status: "error", message: "The picture is too big (8 MB at most)." }, { status: 413 });
  const res = await fetch(`${API_BASE}/api/user/me/avatar`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": type }, body, cache: "no-store" });
  return new Response(await res.text(), { status: res.status, headers: { "content-type": "application/json" } });
}
