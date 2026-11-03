import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/server/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/crm", "/checkout", "/orders", "/profile", "/myprofile", "/wishlist", "/_next/"] }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
