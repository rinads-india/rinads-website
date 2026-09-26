/**
 * Pure, dependency-free helpers backing the production go-live verification
 * tooling (`scripts/ops/verify-production.ts` and `scripts/ops/preflight-config.ts`)
 * and their unit tests.
 *
 * Everything here is read-only and side-effect free: it evaluates configuration
 * and parses responses. It never contacts a provider, sends a message, or
 * mutates anything. Actual production execution (applying migrations, setting
 * secrets, enabling workers) remains a founder action per
 * docs/founder-audit/FOUNDER-SIGNOFF.md.
 */

export type CheckResult = {
  ok: boolean;
  problems: string[];
  warnings: string[];
};

type EnvMap = Record<string, string | undefined>;

function present(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Evaluate the production environment contract for an app (website or
 * rinaglow). Mirrors `@rinads/auth`'s request-time contract and extends it
 * with the deploy-time keys the cutover checklist requires.
 */
export function evaluateEnvContract(env: EnvMap): CheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];

  if (env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase") {
    problems.push('NEXT_PUBLIC_AUTH_PROVIDER must be "supabase" in production (demo auth is forbidden).');
  }
  if (env.USE_DEMO_STORE === "1") {
    problems.push("USE_DEMO_STORE=1 is forbidden in production (tenancy bypass).");
  }
  if (env.USE_SUPABASE !== "1") {
    problems.push("USE_SUPABASE must be 1 in production.");
  }
  if (!present(env.NEXT_PUBLIC_SUPABASE_URL)) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL is required.");
  }
  if (!present(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }
  if (!present(env.SUPABASE_SERVICE_ROLE_KEY)) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is required (server-only).");
  } else if (env.SUPABASE_SERVICE_ROLE_KEY === env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY must not equal the anon key.");
  }

  const cookieDomain = env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;
  if (!present(cookieDomain)) {
    problems.push("NEXT_PUBLIC_AUTH_COOKIE_DOMAIN is required for cross-host SSO (e.g. .rinads.com).");
  } else if (!cookieDomain!.startsWith(".")) {
    problems.push('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN must be a bare leading-dot parent domain (e.g. ".rinads.com").');
  } else if (/^https?:\/\//.test(cookieDomain!) || cookieDomain!.includes("/")) {
    problems.push("NEXT_PUBLIC_AUTH_COOKIE_DOMAIN must not include a scheme or path.");
  }

  if (!present(env.NEXT_PUBLIC_RINAGLOW_URL)) {
    warnings.push("NEXT_PUBLIC_RINAGLOW_URL is unset; salon deep-links fall back to defaults.");
  }
  if (!present(env.NEXT_PUBLIC_SITE_URL)) {
    warnings.push("NEXT_PUBLIC_SITE_URL is unset; SEO canonical/sitemap use the built-in default.");
  }

  return { ok: problems.length === 0, problems, warnings };
}

export type HealthParse = {
  reachable: boolean;
  status: string | null;
  contractOk: boolean;
};

/** Parse the JSON body returned by an app's `/api/health` endpoint. */
export function parseHealthResponse(body: unknown): HealthParse {
  if (!body || typeof body !== "object") {
    return { reachable: true, status: null, contractOk: false };
  }
  const record = body as Record<string, unknown>;
  const status = typeof record.status === "string" ? record.status : null;
  const checks = (record.checks as Record<string, unknown> | undefined) ?? {};
  const contractOk = status === "ok" && checks.productionEnvContract === "ok";
  return { reachable: true, status, contractOk };
}

/**
 * Build the read-only Supabase REST URL used to probe whether a table exists /
 * is reachable. Uses a HEAD-style count query with `limit=0`; the caller sends
 * `Prefer: count=exact` and never writes.
 */
export function buildTablePresenceUrl(baseUrl: string, table: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/rest/v1/${encodeURIComponent(table)}?select=*&limit=0`;
}

/** Tables whose presence indicates the core migration set is applied. */
export const MIGRATION_SENTINEL_TABLES = [
  "organizations",
  "organization_members",
  "site_leads",
  "salon_loyalty_accounts",
  "salon_campaigns",
] as const;

export function evaluateTwilioConfig(env: EnvMap): CheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  for (const key of ["RINADS_TWILIO_SID", "RINADS_TWILIO_TOKEN", "RINADS_TWILIO_WHATSAPP_FROM"]) {
    if (!present(env[key])) problems.push(`${key} is required for live WhatsApp send.`);
  }
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_RINAGLOW_URL"]) {
    if (present(env[key]) && /^NEXT_PUBLIC_TWILIO/i.test(key)) {
      problems.push(`${key} must not expose Twilio secrets to the browser.`);
    }
  }
  if (Object.keys(env).some((k) => /^NEXT_PUBLIC_.*TWILIO/i.test(k))) {
    problems.push("Twilio credentials must never be exposed via a NEXT_PUBLIC_ variable.");
  }
  return { ok: problems.length === 0, problems, warnings };
}

export function evaluateCommsWorkerConfig(env: EnvMap): CheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  if (env.RINADS_COMMUNICATIONS_WORKER_ENABLED !== "1") {
    warnings.push("RINADS_COMMUNICATIONS_WORKER_ENABLED is not 1; worker stays disabled (safe default).");
    return { ok: true, problems, warnings };
  }
  if (!present(env.SUPABASE_URL) && !present(env.NEXT_PUBLIC_SUPABASE_URL)) {
    problems.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required when the worker is enabled.");
  }
  if (!present(env.SUPABASE_SERVICE_ROLE_KEY)) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is required when the worker is enabled.");
  }
  if (!present(env.RINADS_CRON_SECRET) || env.RINADS_CRON_SECRET !== env.RINADS_CRON_INVOCATION_TOKEN) {
    problems.push("RINADS_CRON_SECRET must be set and equal RINADS_CRON_INVOCATION_TOKEN for an authenticated tick.");
  }
  const orgs = (env.RINADS_COMMUNICATIONS_ORGANIZATION_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (orgs.length === 0) {
    problems.push("RINADS_COMMUNICATIONS_ORGANIZATION_IDS must explicitly allowlist at least one org.");
  }
  return { ok: problems.length === 0, problems, warnings };
}

export function evaluateRazorpayConfig(env: EnvMap): CheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  for (const key of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]) {
    if (!present(env[key])) problems.push(`${key} is required for live Razorpay billing.`);
  }
  if (present(env.RAZORPAY_KEY_ID) && !present(env.NEXT_PUBLIC_RAZORPAY_KEY_ID)) {
    warnings.push("NEXT_PUBLIC_RAZORPAY_KEY_ID is unset; browser checkout cannot initialize.");
  }
  if (present(env.RAZORPAY_KEY_SECRET) && env.RAZORPAY_KEY_SECRET === env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    problems.push("RAZORPAY_KEY_SECRET must never be exposed as NEXT_PUBLIC_RAZORPAY_KEY_ID.");
  }
  return { ok: problems.length === 0, problems, warnings };
}
