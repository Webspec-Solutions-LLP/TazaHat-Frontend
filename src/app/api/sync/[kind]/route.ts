import { NextResponse } from "next/server";
import { userApi } from "@/lib/server/session";

/**
 * The background copies of the cart, wishlist and compare list (CartSync, WishlistSync, CompareSync). They go through a route handler, not
 * a server action: a server action that renews the sign-in cookies makes Next re-render the whole page, a route handler does not - so a
 * live change never shows as a page reload.
 */
const KINDS = new Set(["cart", "wishlist", "compare"]);
const MAX = { wishlist: 300, compare: 4 } as const;

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!KINDS.has(kind)) return NextResponse.json({ ok: false }, { status: 404 });
  const res = await userApi<Record<string, unknown>>(`/${kind}`);
  return NextResponse.json(res.ok ? { ok: true, data: res.data } : { ok: false }, { status: res.ok ? 200 : res.status });
}

export async function PUT(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!KINDS.has(kind)) return NextResponse.json({ ok: false }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { slugs?: unknown; lines?: unknown; clientId?: unknown };
  let payload: unknown;
  if (kind === "cart") {
    const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 100).filter((l): l is Record<string, unknown> => !!l && typeof (l as { variantId?: unknown }).variantId === "string" && (l as { variantId: string }).variantId.length <= 60).map((l) => ({
      variantId: l.variantId,
      cuttingTypeId: typeof l.cuttingTypeId === "string" && l.cuttingTypeId.length <= 60 ? l.cuttingTypeId : null,
      quantity: Math.max(1, Math.min(99, Math.floor(Number(l.quantity)) || 1)),
      note: typeof l.note === "string" && l.note ? l.note.slice(0, 200) : null,
    }));
    payload = { lines, clientId: typeof body.clientId === "string" ? body.clientId.slice(0, 60) : null };
  } else {
    const slugs = [...new Set((Array.isArray(body.slugs) ? body.slugs : []).filter((s): s is string => typeof s === "string" && /^[\w-]{1,160}$/.test(s)))].slice(0, MAX[kind as "wishlist" | "compare"]);
    payload = { slugs };
  }
  const res = await userApi<Record<string, unknown>>(`/${kind}`, { method: "PUT", body: payload });
  return NextResponse.json(res.ok ? { ok: true, data: res.data } : { ok: false }, { status: res.ok ? 200 : res.status });
}
