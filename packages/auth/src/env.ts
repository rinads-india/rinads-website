export type AuthRuntimeEnv = {
  VERCEL_ENV?: string;
  NODE_ENV?: string;
  USE_DEMO_STORE?: string;
  NEXT_PUBLIC_AUTH_PROVIDER?: string;
  NEXT_PUBLIC_PLATFORM_DEMO?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_PLATFORM_ADMIN_URL?: string;
  NEXT_PUBLIC_OWNER_PORTAL_URL?: string;
  NEXT_PUBLIC_CUSTOMER_PORTAL_URL?: string;
  NEXT_PUBLIC_RINAGLOW_URL?: string;
};

function readEnv(env: AuthRuntimeEnv, key: keyof AuthRuntimeEnv): string | undefined {
  const value = env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function readAuthRuntimeEnv(): AuthRuntimeEnv {
  return (globalThis as { process?: { env?: AuthRuntimeEnv } }).process?.env ?? {};
}

/**
 * Production cookie / portal-URL flag.
 * `VERCEL_ENV=production` wins. `NODE_ENV` is used only when `VERCEL_ENV` is absent.
 */
export function isProductionCookieEnv(env: AuthRuntimeEnv = readAuthRuntimeEnv()): boolean {
  const vercelEnv = readEnv(env, "VERCEL_ENV");
  if (vercelEnv !== undefined) {
    return vercelEnv === "production";
  }
  return readEnv(env, "NODE_ENV") === "production";
}

export function isDevelopmentRuntime(env: AuthRuntimeEnv = readAuthRuntimeEnv()): boolean {
  const vercelEnv = readEnv(env, "VERCEL_ENV");
  if (vercelEnv !== undefined) {
    return vercelEnv === "development";
  }
  return readEnv(env, "NODE_ENV") === "development";
}

/**
 * Platform (and portal) demo bypass is development-only and must be explicit.
 * Preview and production always fail closed.
 */
export function allowDevelopmentAuthBypass(env: AuthRuntimeEnv = readAuthRuntimeEnv()): boolean {
  if (!isDevelopmentRuntime(env)) return false;
  return env.USE_DEMO_STORE === "1" || env.NEXT_PUBLIC_PLATFORM_DEMO === "1";
}
