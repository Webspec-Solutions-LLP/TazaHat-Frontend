import { permanentRedirect } from "next/navigation";

/** Old address /productDetails?id=<slug> -> /<slug> */
export default async function OldProductDetails({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await searchParams;
  const slug = Array.isArray(id) ? id[0] : id;
  permanentRedirect(slug ? `/${encodeURIComponent(slug)}` : "/products");
}
