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
      // Legacy → platform pillars
      { source: "/business-os", destination: "/platform/business", permanent: true },
      { source: "/platform/business-os", destination: "/platform/business", permanent: true },
      { source: "/platform/commerce-os", destination: "/platform/commerce", permanent: true },
      { source: "/platform/marketing-os", destination: "/platform/growth", permanent: true },
      { source: "/platform/creative-os", destination: "/platform/growth", permanent: true },
      { source: "/platform/automation-os", destination: "/platform/automation", permanent: true },
      { source: "/platform/logistics-os", destination: "/platform/automation", permanent: true },
      { source: "/platform/people-os", destination: "/platform/business", permanent: true },
      { source: "/platform/build-os", destination: "/platform/business", permanent: true },
      { source: "/platform/academy-os", destination: "/resources/academy", permanent: true },
      { source: "/platform/rinads-intelligence", destination: "/platform/intelligence", permanent: true },
      { source: "/platform/rinads-cloud", destination: "/platform/cloud", permanent: true },
      { source: "/rinpo-intelligence", destination: "/platform/intelligence", permanent: true },
      { source: "/cloud", destination: "/platform/cloud", permanent: true },
      { source: "/rinads-cloud", destination: "/platform/cloud", permanent: true },
      { source: "/grow", destination: "/platform/growth", permanent: true },
      // Company / about
      { source: "/about", destination: "/company", permanent: true },
      { source: "/contact", destination: "/company/contact", permanent: true },
      { source: "/careers", destination: "/company/careers", permanent: true },
      // Trust
      { source: "/security", destination: "/trust/security", permanent: true },
      { source: "/status", destination: "/trust/status", permanent: true },
      // Resources
      { source: "/resources/business-readiness", destination: "/business-readiness", permanent: true },
      { source: "/academy", destination: "/resources/academy", permanent: true },
      { source: "/docs", destination: "/resources/docs", permanent: true },
      { source: "/developers", destination: "/resources/developers", permanent: true },
      // Editions
      { source: "/solutions/nursery", destination: "/solutions/landscape", permanent: true },
      // Narrative
      { source: "/rinpo-story", destination: "/company/rinpo-story", permanent: true },
      { source: "/rinpo/story", destination: "/company/rinpo-story", permanent: true },
      // Business OS alias — temporary until /bos IA is fully adopted.
      { source: "/bos", destination: "/os", permanent: false },
      { source: "/bos/home", destination: "/os", permanent: false },
      { source: "/bos/customers", destination: "/os/customers", permanent: false },
      { source: "/bos/work", destination: "/os/work", permanent: false },
      { source: "/bos/work/:path*", destination: "/os/work/:path*", permanent: false },
      { source: "/bos/money", destination: "/os/money", permanent: false },
      { source: "/bos/growth", destination: "/os/growth", permanent: false },
      { source: "/bos/automate", destination: "/os/automate", permanent: false },
      { source: "/bos/rooms", destination: "/os/rooms", permanent: false },
      { source: "/bos/settings", destination: "/os/settings", permanent: false },
      { source: "/bos/:path*", destination: "/os/:path*", permanent: false },
      // Quarantine: former concept HTML with unverified trust claims.
      { source: "/story-concept", destination: "/", permanent: true },
      { source: "/story-concept/:path*", destination: "/", permanent: true },
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
    "@rinads/company-os",
    "@rinads/company-os-server",
    "@rinads/intelligence",
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
