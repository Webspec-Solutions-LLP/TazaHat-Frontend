import type { Metadata } from "next";
import SiteNotFound from "@/components/notFound/SiteNotFound";

// a page that calls notFound() shows this (a route group's root not-found.tsx is not used for it, so each such route has its own)
export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: false } };
export default SiteNotFound;
