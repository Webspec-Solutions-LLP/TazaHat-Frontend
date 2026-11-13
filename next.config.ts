import type { NextConfig } from "next";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    // the orders pages used to live under /myOrders (details as ?orderId=...)
    return [
      { source: "/myOrders/orderDetails", has: [{ type: "query", key: "orderId", value: "(?<id>[\\w-]+)" }], destination: "/orders/:id", permanent: false },
      { source: "/myOrders", destination: "/orders", permanent: false },
      // the privacy policy now lives in the CRM's legal documents
      { source: "/privacyPolicy", destination: "/legal/privacy-policy", permanent: true },
      // About, Contact and Delivery pages too: their text (company, e-mail, phone, address) is written in the CRM, not in the code
      { source: "/aboutUs", destination: "/legal/about-us", permanent: true },
      { source: "/contactUs", destination: "/legal/contact-us", permanent: true },
      { source: "/deliveryService", destination: "/legal/delivery-shipping-policy", permanent: true },
    ];
  },
  async rewrites() {
    // Product / category pictures live on the API. The browser asks this site for them, so the API address stays hidden.
    return [{ source: "/uploads/:path*", destination: `${API_BASE_URL}/uploads/:path*` }];
  },
};

export default nextConfig;
