import { getSharedAuthCookieOptions } from "@rinads/auth";

export const AUTH_COOKIE_DOMAIN_ENV = "NEXT_PUBLIC_AUTH_COOKIE_DOMAIN";

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function websiteAuthCookieOptions() {
  return getSharedAuthCookieOptions();
}
