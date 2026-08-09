import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default 10MB truncates large PDF uploads proxied via /api rewrites.
    middlewareClientMaxBodySize: "50mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8001/:path*",
      },
    ];
  },
};

export default nextConfig;
