import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rinads/brand",
    "@rinads/ui",
    "@rinads/commerce",
    "@rinads/commerce-server",
    "@rinads/intelligence",
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
