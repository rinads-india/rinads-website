import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rinads/auth",
    "@rinads/database",
    "@rinads/permissions",
    "@rinads/salon",
    "@rinads/salon-server",
    "@rinads/tenancy",
    "@rinads/ui",
  ],
};

export default nextConfig;
