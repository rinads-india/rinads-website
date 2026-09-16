import { sharedAuthCookieOptions } from "@rinads/database";

export const AUTH_COOKIE_DOMAIN_ENV = "NEXT_PUBLIC_AUTH_COOKIE_DOMAIN";

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function websiteAuthCookieOptions() {
  return sharedAuthCookieOptions({
    cookieDomain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
    // NODE_ENV is inlined into browser bundles; VERCEL_ENV is server-only.
    production: process.env.NODE_ENV === "production",
  });
}
