import { NextResponse } from "next/server";
import { getLegalList } from "@/lib/server/api";

/** the legal documents that are linked on the sign-in screen (the browser asks for them once) */
export async function GET() {
  const docs = (await getLegalList()).filter((d) => d.login).map((d) => ({ slug: d.slug, title: d.title }));
  return NextResponse.json({ documents: docs }, { headers: { "cache-control": "public, max-age=300" } });
}
