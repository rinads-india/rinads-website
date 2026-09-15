import type { NextConfig } from "next";
import { assertProductionEnvContract } from "@rinads/auth";

// Build-time gate: fail the build outright if a Production Vercel build is
// misconfigured with demo auth / demo data. Vercel injects the target
// environment's real values at build time, so this catches the
// misconfiguration before a bad deploy ever goes live (it would otherwise
// only be caught at request time by middleware — see docs/deployment/POLICY.md).
assertProductionEnvContract();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/business-os", destination: "/platform/business-os", permanent: true },
      { source: "/rinpo-intelligence", destination: "/platform/rinads-intelligence", permanent: true },
      { source: "/cloud", destination: "/platform/rinads-cloud", permanent: true },
      { source: "/rinads-cloud", destination: "/platform/rinads-cloud", permanent: true },
      { source: "/rinpo-story", destination: "/rinpo/story", permanent: true },
      { source: "/grow", destination: "/platform/marketing-os", permanent: true },
    ];
  },
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
    "@rinads/salon",
    "@rinads/salon-server",
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
