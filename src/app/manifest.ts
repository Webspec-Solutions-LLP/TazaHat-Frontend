import type { MetadataRoute } from "next";
import { getSiteIdentity } from "@/lib/server/site";

/** The web app manifest (add to home screen): the name and icons are the ones uploaded in the CRM. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const id = await getSiteIdentity();
  return {
    name: id.name, short_name: id.name, description: "Fresh fish, meat and groceries delivered", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#0a3f76",
    icons: [{ src: id.logo, sizes: "512x512", type: "image/webp", purpose: "any" }, { src: id.favicon, sizes: "192x192", type: "image/webp" }],
  };
}
