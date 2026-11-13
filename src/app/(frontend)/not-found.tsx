import type { Metadata } from "next";
import SiteNotFound from "@/components/notFound/SiteNotFound";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: false } };
export default SiteNotFound;
