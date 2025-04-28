import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true, // Enable strict mode but with proper safeguards in place
  compiler: {
    emotion: true, // Enable emotion compiler for better CSS handling
  },
  // Only include minimal experimental features that are stable
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
