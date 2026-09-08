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
    "@rinads/database",
    "@rinads/permissions",
    "@rinads/salon",
    "@rinads/salon-server",
    "@rinads/tenancy",
    "@rinads/ui",
  ],
};

export default nextConfig;
