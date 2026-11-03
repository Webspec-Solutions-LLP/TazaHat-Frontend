import type { Metadata } from "next";

export const metadata: Metadata = { title: "Delivery service", description: "Delivery areas, time slots, fees and store pickup: how your fresh order reaches you.", alternates: { canonical: "/deliveryService" } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
