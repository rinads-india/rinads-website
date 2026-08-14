import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/story-concept", destination: "/story-concept/index.html" },
    ];
  },
  transpilePackages: [
    "@rinads/brand",
    "@rinads/shared",
    "@rinads/auth",
    "@rinads/permissions",
    "@rinads/database",
    "@rinads/ui",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "strvid.nyc3.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
