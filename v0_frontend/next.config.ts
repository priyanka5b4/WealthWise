import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plaid-category-icons.plaid.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { crypto: false };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*", // The path you want to proxy
        destination: "http://localhost:8000/api/:path*", // The destination URL
      },
    ];
  },
};

export default nextConfig;
