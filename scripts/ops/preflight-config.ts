/**
 * Read-only configuration preflight for the RINADS go-live runbook.
 *
 * Reads the current process environment and reports whether the production env
 * contract and the (founder-gated) provider integrations are correctly shaped.
 * It performs NO network calls and NO writes — it only validates the presence
 * and shape of variables. Enabling anything remains a founder action per
 * docs/founder-audit/FOUNDER-SIGNOFF.md.
 *
 * Usage:  pnpm ops:preflight
 */
import {
  evaluateCommsWorkerConfig,
  evaluateEnvContract,
  evaluateRazorpayConfig,
  evaluateTwilioConfig,
  type CheckResult,
} from "../../apps/website/lib/ops/go-live-checks";

let hardFailures = 0;

function report(section: string, result: CheckResult, gated: boolean): void {
  console.log(`\n[${section}]${gated ? " (founder-gated)" : ""}`);
  for (const problem of result.problems) console.log(`  \u2717 ${problem}`);
  for (const warning of result.warnings) console.log(`  ! ${warning}`);
  if (result.ok && result.problems.length === 0) console.log("  \u2713 ready");
  if (!result.ok && !gated) hardFailures += 1;
}

function main() {
  const env = process.env as Record<string, string | undefined>;
  console.log("RINADS configuration preflight (read-only; no network, no writes)");

  // The env contract is the only mandatory gate for a healthy production app.
  report("production env contract", evaluateEnvContract(env), false);

  // Provider integrations are optional and founder-gated; report readiness
  // without failing the preflight when they are intentionally not configured.
  report("twilio whatsapp", evaluateTwilioConfig(env), true);
  report("communications worker", evaluateCommsWorkerConfig(env), true);
  report("razorpay billing", evaluateRazorpayConfig(env), true);

  console.log("");
  if (hardFailures > 0) {
    console.log(`FAILED: production env contract is not satisfied.`);
    process.exit(1);
  }
  console.log("OK: env contract satisfied. Provider sections are informational only.");
}

main();
