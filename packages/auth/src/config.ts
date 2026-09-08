import type { AuthConfig } from "./types";

export function resolveAuthConfig(env: {
  NEXT_PUBLIC_AUTH_PROVIDER?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}): AuthConfig {
  const provider =
    env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase" ? "supabase" : "demo";

  return {
    provider,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseAuthReady(config: AuthConfig): boolean {
  return (
    config.provider === "supabase" &&
    Boolean(config.supabaseUrl && config.supabaseAnonKey)
  );
}

export class ProductionEnvContractError extends Error {}

/**
 * Production env contract: on a real Vercel production deployment
 * (VERCEL_ENV=production), demo auth / demo data mode must never be active.
 * Call this from middleware in every app so a misconfigured production
 * deploy fails closed (every request is rejected) instead of silently
 * serving fabricated demo data to real users.
 */
type ProductionEnvContractInput = {
  VERCEL_ENV?: string;
  NEXT_PUBLIC_AUTH_PROVIDER?: string;
  USE_DEMO_STORE?: string;
};

function currentProcessEnv(): ProductionEnvContractInput {
  const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;
  return globalProcess?.env ?? {};
}

export function assertProductionEnvContract(
  env: ProductionEnvContractInput = currentProcessEnv()
): void {
  if (env.VERCEL_ENV !== "production") return;

  const problems: string[] = [];
  if (env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase") {
    problems.push(
      'NEXT_PUBLIC_AUTH_PROVIDER must be "supabase" in production (VERCEL_ENV=production); demo auth is forbidden.'
    );
  }
  if (env.USE_DEMO_STORE === "1") {
    problems.push("USE_DEMO_STORE=1 is forbidden when VERCEL_ENV=production.");
  }
  if (problems.length) {
    throw new ProductionEnvContractError(
      `Production environment contract violated:\n- ${problems.join("\n- ")}`
    );
  }
}
