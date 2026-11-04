/**
 * RINADS public production smoke: read-only HTTP GET requests only.
 * Never authenticates, creates a tenant, sends customer messages, or invokes payment APIs.
 * Health/route checks prove reachability and public fail-closed behavior, NOT business E2E.
 */
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const HEALTH = Object.freeze({
  website: "https://www.rinads.com/api/health",
  platformAdmin: "https://admin.rinads.com/api/health",
  ownerPortal: "https://app.rinads.com/api/health",
  customerPortal: "https://customers.rinads.com/api/health",
  salonPilot: "https://glow.rinads.com/api/health",
  clients: "https://clients.rinads.com/api/health",
  creators: "https://creators.rinads.com/api/health",
});

export const MARKETING = Object.freeze({
  homepage: "/",
  pricing: "/pricing",
  contact: "/company/contact",
  solutions: "/solutions",
  rinpo: "/rinpo",
  readiness: "/business-readiness",
  signup: "/signup",
});

const BASE = "https://www.rinads.com";
const RETRIES = 2;
const timeoutMs = 10000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function validHealth(status, body) {
  return status === 200 && body?.status === "ok" &&
    body?.checks?.productionEnvContract === "ok";
}

export function validAnonymousGate(status, location) {
  if (![301, 302, 303, 307, 308].includes(status)) return false;
  if (!location || typeof location !== "string") return false;
  try {
    const url = new URL(location, BASE);
    return url.origin === BASE && url.pathname === "/signup" &&
      url.searchParams.get("next") === "/os";
  } catch {
    return false;
  }
}

export function validPublicRoute(path, status, html) {
  if (status !== 200 || typeof html !== "string") return false;
  if (!/<html\b/i.test(html) || !/RINADS/i.test(html)) return false;
  if (path === "/") return html.includes("Business, simplified.") &&
    html.includes("Synthetic demo") && html.includes("RINPO");
  return true;
}

export function validRinpoCapability(status, body) {
  // "enabled: false" is honest, valid and distinct from a working live avatar session.
  return status === 200 && body !== null &&
    typeof body === "object" && typeof body.enabled === "boolean";
}

async function fetchOnce(url, kind, path, fetcher) {
  const resp = await fetcher(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: kind === "health" || kind === "rinpo" ? "application/json" : "text/html",
      "user-agent": "RINADS-ReadOnly-Production-Monitor/1.0",
    },
  });

  if (kind === "health" || kind === "rinpo") {
    const body = await resp.json().catch(() => null);
    const passed = kind === "health"
      ? validHealth(resp.status, body)
      : validRinpoCapability(resp.status, body);
    const detail = kind === "rinpo"
      ? (passed ? (body.enabled ? "capability enabled; session unverified" : "capability disabled; expected") : "invalid capability response")
      : (passed ? "200 / ok / productionEnvContract:ok" : "unhealthy health response");
    return { passed, detail, code: resp.status };
  }
  if (kind === "gate") {
    const location = resp.headers.get("location");
    const passed = validAnonymousGate(resp.status, location);
    return { passed, detail: passed ? "redirected anonymously to signup" : "unexpected anonymous access behavior", code: resp.status };
  }
  const html = await resp.text();
  const passed = validPublicRoute(path, resp.status, html);
  return { passed, detail: passed ? "HTTP 200 + expected public HTML" : "invalid HTML/status or homepage contract", code: resp.status };
}

async function check(entry, fetcher) {
  let outcome;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      outcome = await fetchOnce(entry.url, entry.kind, entry.path, fetcher);
    } catch (error) {
      outcome = { passed: false, code: 0, detail: error instanceof Error ? error.message : "request failed" };
    }
    if (outcome.passed) return { ...entry, ...outcome, attempt };
    if (attempt < RETRIES) await delay(600);
  }
  return { ...entry, ...outcome, attempt: RETRIES };
}

export function buildChecks() {
  const health = Object.entries(HEALTH).map(([name, url]) => ({ name: `health: ${name}`, url, kind: "health" }));
  const marketing = Object.entries(MARKETING).map(([name, path]) => ({ name: `route: ${name}`, url: BASE + path, path, kind: "marketing" }));
  return [
    ...health,
    ...marketing,
    { name: "anonymous OS protection", url: BASE + "/os", path: "/os", kind: "gate" },
    { name: "RINPO Live capability", url: BASE + "/api/rinpo/live", kind: "rinpo" },
  ];
}

export async function run(fetcher = fetch) {
  const results = await Promise.all(buildChecks().map((entry) => check(entry, fetcher)));
  const table = [
    "## RINADS public production smoke — read-only",
    "",
    "Public reachability and auth-gate only; not a transaction, database, tenant or avatar-session test.",
    "",
    "| Check | Result | HTTP | Detail |",
    "| --- | --- | ---: | --- |",
    ...results.map((r) => `| ${r.name} | ${r.passed ? "PASS" : "FAIL"} | ${r.code} | ${r.detail.replaceAll("|", "/")} (attempt ${r.attempt}) |`),
    "",
    `**Passed ${results.filter((r) => r.passed).length}/${results.length}.**`,
  ].join("\n");
  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table + "\n");
  if (results.some((r) => !r.passed)) process.exitCode = 1;
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => { console.error(error); process.exitCode = 1; });
}
