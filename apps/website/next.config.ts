import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rinads/brand",
    "@rinads/shared",
    "@rinads/auth",
    "@rinads/permissions",
    "@rinads/database",
    "@rinads/ui",
  ],
};

export default nextConfig;
