import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rinads/commerce",
    "@rinads/commerce-server",
    "@rinads/database",
    "@rinads/operations",
    "@rinads/operations-server",
    "@rinads/permissions",
    "@rinads/tenancy",
    "@rinads/ui",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
