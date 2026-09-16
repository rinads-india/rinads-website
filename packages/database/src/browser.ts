import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { Database, DatabaseConfig } from "./types";
import { isDatabaseConfigured } from "./types";

export type SupabaseCookieOptions = Pick<
  CookieOptions,
  "domain" | "path" | "sameSite" | "secure"
>;

export function isValidParentCookieDomain(value: string | undefined): value is string {
  if (!value || value.length > 253 || !value.startsWith(".")) return false;
  const hostname = value.slice(1);
  if (!hostname.includes(".") || !/^[a-z0-9.-]+$/.test(hostname)) return false;
  return hostname.split(".").every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );
}

export function sharedAuthCookieOptions(input: {
  cookieDomain?: string;
  production?: boolean;
}): SupabaseCookieOptions | undefined {
  if (!input.production || !isValidParentCookieDomain(input.cookieDomain)) return undefined;
  return {
    domain: input.cookieDomain,
    path: "/",
    sameSite: "lax",
    secure: true,
  };
}

export function createBrowserSupabaseClient(
  config: Partial<DatabaseConfig>,
  cookieOptions?: SupabaseCookieOptions
) {
  if (!isDatabaseConfigured(config)) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient<Database>(config.url, config.anonKey, { cookieOptions });
}
