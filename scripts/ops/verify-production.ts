/**
 * Read-only production verification for the RINADS go-live runbook.
 *
 * This script NEVER writes anything and NEVER sends messages or payments. It
 * only performs safe reads: HTTP GETs against `/api/health` and, when a
 * Supabase service-role key is provided, zero-row REST probes to confirm the
 * core migration set is applied. Executing the actual cutover (applying
 * migrations, setting secrets, enabling workers) remains a founder action —
 * see docs/founder-audit/FOUNDER-SIGNOFF.md.
 *
 * Usage:
 *   pnpm ops:verify --website https://www.rinads.com --glow https://glow.rinads.com
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm ops:verify --website https://www.rinads.com
 *
 * Exit code is non-zero if any hard check fails.
 */
import {
  MIGRATION_SENTINEL_TABLES,
  buildTablePresenceUrl,
  parseHealthResponse,
} from "../../apps/website/lib/ops/go-live-checks";

type Cli = { website?: string; glow?: string };

function parseArgs(argv: string[]): Cli {
  const cli: Cli = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--website") cli.website = argv[++i];
    else if (arg === "--glow") cli.glow = argv[++i];
  }
  return cli;
}

let hardFailures = 0;

function ok(msg: string) {
  console.log(`  \u2713 ${msg}`);
}
function fail(msg: string) {
  hardFailures += 1;
  console.log(`  \u2717 ${msg}`);
}
function info(msg: string) {
  console.log(`  \u2022 ${msg}`);
}

async function checkHealth(label: string, baseUrl: string): Promise<void> {
  console.log(`\n[${label}] ${baseUrl}/api/health`);
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/health`, {
      headers: { accept: "application/json" },
    });
    const body = await res.json().catch(() => null);
    const parsed = parseHealthResponse(body);
    if (res.ok && parsed.contractOk) ok(`healthy (status=${parsed.status}, productionEnvContract=ok)`);
    else fail(`unhealthy (http=${res.status}, status=${parsed.status ?? "unknown"})`);
  } catch (error) {
    fail(`unreachable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function checkMigrations(): Promise<void> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`\n[supabase] migration sentinel tables (read-only)`);
  if (!url || !key) {
    info("skipped: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to probe table presence");
    return;
  }
  for (const table of MIGRATION_SENTINEL_TABLES) {
    try {
      const res = await fetch(buildTablePresenceUrl(url, table), {
        method: "GET",
        headers: { apikey: key, authorization: `Bearer ${key}`, accept: "application/json" },
      });
      if (res.ok) ok(`table present: ${table}`);
      else fail(`table missing or unreadable: ${table} (http=${res.status})`);
    } catch (error) {
      fail(`probe failed for ${table}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  console.log("RINADS production verification (read-only)");
  if (!cli.website && !cli.glow) {
    console.log("\nNo targets given. Pass --website <url> and/or --glow <url>.");
  }
  if (cli.website) await checkHealth("website", cli.website);
  if (cli.glow) await checkHealth("glow", cli.glow);
  await checkMigrations();

  console.log("");
  if (hardFailures > 0) {
    console.log(`FAILED: ${hardFailures} hard check(s) failed.`);
    process.exit(1);
  }
  console.log("OK: all executed checks passed (this does not perform any cutover action).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
