import type { Metadata } from "next";

// private pages (the customer's own things) stay out of search results
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
