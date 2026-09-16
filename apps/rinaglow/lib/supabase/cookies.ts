import { sharedAuthCookieOptions } from "@rinads/database";

export function rinaglowAuthCookieOptions() {
  return sharedAuthCookieOptions({
    cookieDomain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
    // NODE_ENV is available in both the browser and server bundles.
    production: process.env.NODE_ENV === "production",
  });
}
