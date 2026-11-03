import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact us", description: "Contact our customer care and delivery team by chat, phone or email, or raise a support ticket.", alternates: { canonical: "/contactUs" } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
