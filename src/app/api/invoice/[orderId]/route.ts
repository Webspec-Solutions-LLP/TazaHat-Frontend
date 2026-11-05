import { currentAccessToken } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

/**
 * The invoice (a thermal receipt PDF, or A4) of the customer's OWN order: browser -> here (login cookie) -> API (bearer). The API hands it only to the person who
 * placed the order, so a copied address opens nothing for anybody else (they are asked to log in, or get "not found").
 */
export async function GET(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const token = await currentAccessToken();
  if (!token) return Response.json({ status: "error", message: "Please log in." }, { status: 401 });
  const { orderId } = await ctx.params;
  const search = new URL(request.url).search;
  const res = await fetch(`${API_BASE}/api/user/orders/${encodeURIComponent(orderId)}/invoice${search}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  const headers = new Headers();
  for (const h of ["content-type", "content-disposition"]) { const v = res.headers.get(h); if (v) headers.set(h, v); }
  headers.set("cache-control", "private, no-store");
  return new Response(await res.arrayBuffer(), { status: res.status, headers });
}
