import type { NextConfig } from "next";
import { assertProductionEnvContract } from "@rinads/auth";

// Build-time gate: fail the build outright if a Production Vercel build is
// misconfigured with demo auth / demo data. Vercel injects the target
// environment's real values at build time, so this catches the
// misconfiguration before a bad deploy ever goes live (it would otherwise
// only be caught at request time by middleware — see docs/deployment/POLICY.md).
assertProductionEnvContract();

const nextConfig: NextConfig = {
  transpilePackages: [
    "@rinads/auth",
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
