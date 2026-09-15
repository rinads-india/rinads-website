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

/** Returns the list of contract violations, or an empty array when the environment is fine (or not production at all). */
function findProductionEnvContractProblems(env: ProductionEnvContractInput): string[] {
  if (env.VERCEL_ENV !== "production") return [];

  const problems: string[] = [];
  if (env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase") {
    problems.push(
      'NEXT_PUBLIC_AUTH_PROVIDER must be "supabase" in production (VERCEL_ENV=production); demo auth is forbidden.'
    );
  }
  if (env.USE_DEMO_STORE === "1") {
    problems.push("USE_DEMO_STORE=1 is forbidden when VERCEL_ENV=production.");
  }
  return problems;
}

/**
 * Throws when the production env contract is violated. Intended for
 * build-time use (e.g. the top of every app's `next.config.ts`) — Vercel
 * injects the real target-environment values during the build step, so a
 * misconfigured Production build fails outright instead of shipping a
 * deployment that will 500 on every request. Also usable anywhere a hard
 * failure is the right behavior.
 */
export function assertProductionEnvContract(
  env: ProductionEnvContractInput = currentProcessEnv()
): void {
  const problems = findProductionEnvContractProblems(env);
  if (problems.length) {
    throw new ProductionEnvContractError(
      `Production environment contract violated:\n- ${problems.join("\n- ")}`
    );
  }
}

export type ProductionEnvContractResult = { ok: true } | { ok: false; message: string };

/**
 * Non-throwing counterpart to `assertProductionEnvContract`, for use in
 * request-time code (middleware) where a misconfiguration must still fail
 * closed, but as a controlled, loggable response rather than an unhandled
 * exception that crashes the whole middleware invocation.
 */
export function checkProductionEnvContract(
  env: ProductionEnvContractInput = currentProcessEnv()
): ProductionEnvContractResult {
  const problems = findProductionEnvContractProblems(env);
  if (problems.length === 0) return { ok: true };
  return { ok: false, message: `Production environment contract violated:\n- ${problems.join("\n- ")}` };
}

/**
 * Branded, framework-agnostic HTML body for the 503 response middleware
 * returns when `checkProductionEnvContract` fails. Deliberately generic —
 * it must never leak which env var is misconfigured to an end user; the
 * detailed violation message belongs in server logs only.
 */
export function renderProductionEnvContractUnavailablePage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Service Temporarily Unavailable</title>
<meta name="robots" content="noindex" />
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0b0b12;
    color: #f5f5f7;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  main { max-width: 28rem; padding: 2rem; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 0.75rem; }
  p { color: #a1a1aa; line-height: 1.5; margin: 0; }
</style>
</head>
<body>
<main>
<h1>We&rsquo;ll be right back</h1>
<p>This service is temporarily unavailable while we resolve a configuration issue. Please try again shortly.</p>
</main>
</body>
</html>`;
}
