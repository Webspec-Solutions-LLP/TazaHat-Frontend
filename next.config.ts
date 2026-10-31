import type { NextConfig } from "next";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    // Product / category pictures live on the API. The browser asks this site for them, so the API address stays hidden.
    return [{ source: "/uploads/:path*", destination: `${API_BASE_URL}/uploads/:path*` }];
  },
};

export default nextConfig;
