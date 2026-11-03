import type { Metadata } from "next";

export const metadata: Metadata = { title: "About us", description: "Learn about our fresh fish, meat and grocery delivery: how we select, cut, pack and deliver your order.", alternates: { canonical: "/aboutUs" } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
