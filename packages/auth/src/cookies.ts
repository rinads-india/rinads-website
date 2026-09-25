import { isProductionCookieEnv, readAuthRuntimeEnv, type AuthRuntimeEnv } from "./env";

export const AUTH_COOKIE_DOMAIN = ".rinads.com";

export type SharedAuthCookieOptions = {
  path: string;
  sameSite: "lax";
  secure: boolean;
  domain?: string;
};

function defaultEnv(): AuthRuntimeEnv {
  return readAuthRuntimeEnv();
}

/**
 * Shared Supabase auth cookie options.
 * Production (VERCEL_ENV=production, or NODE_ENV when VERCEL_ENV is absent):
 * domain `.rinads.com`, Secure, SameSite=Lax.
 * Preview / development: host-only (no domain).
 */
export function getSharedAuthCookieOptions(
  env: AuthRuntimeEnv = defaultEnv()
): SharedAuthCookieOptions {
  const production = isProductionCookieEnv(env);
  const preview = env.VERCEL_ENV === "preview";
  const options: SharedAuthCookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: production || preview,
  };
  if (production) {
    options.domain = AUTH_COOKIE_DOMAIN;
  }
  return options;
}

export function mergeAuthCookieOptions<T extends Record<string, unknown>>(
  options: T | undefined,
  env: AuthRuntimeEnv = defaultEnv()
): T & SharedAuthCookieOptions {
  return { ...(options ?? ({} as T)), ...getSharedAuthCookieOptions(env) };
}
