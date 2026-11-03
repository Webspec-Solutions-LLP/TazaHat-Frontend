import { getSiteIdentity } from "@/lib/server/site";

/** /favicon.ico (browsers ask for it by itself): the favicon uploaded in the CRM, served from here so the address never changes. */
export async function GET() {
  const id = await getSiteIdentity();
  try {
    const res = await fetch(id.favicon, { next: { revalidate: 300 } });
    if (res.ok) return new Response(await res.arrayBuffer(), { headers: { "content-type": res.headers.get("content-type") ?? "image/webp", "cache-control": "public, max-age=3600" } });
  } catch { /* the logo below */ }
  const logo = await fetch(id.logo).catch(() => null);
  if (logo?.ok) return new Response(await logo.arrayBuffer(), { headers: { "content-type": logo.headers.get("content-type") ?? "image/webp", "cache-control": "public, max-age=600" } });
  return new Response(null, { status: 404 });
}
