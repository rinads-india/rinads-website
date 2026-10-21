import { available, notConnected, unavailable, type EngineeringFacts, type Section } from "@rinads/company-os-engine";

/**
 * Engineering signals from GitHub, Vercel and Supabase.
 *
 * Fail-closed: a source without credentials reads "not connected" — never a guessed status.
 * Tokens are READ-ONLY, server-side, and never returned to callers or logged. Nothing here can
 * deploy, merge, migrate or change configuration (those stay founder-only operations).
 */

export type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type EngineeringConfig = {
  github?: { token?: string; repository?: string };
  vercel?: { token?: string; teamId?: string; projects?: { name: string; id: string }[] };
  supabase?: { url?: string; anonKey?: string };
  fetch?: FetchLike;
  timeoutMs?: number;
  now?: () => Date;
};

async function get(fetchImpl: FetchLike, url: string, headers: Record<string, string>, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const reason = (e: unknown) => (e instanceof Error && e.name === "AbortError" ? "timed out" : e instanceof Error ? e.message.replace(/(token|bearer)\s+\S+/gi, "$1 [redacted]") : "unreachable");

export async function loadEngineeringFacts(config: EngineeringConfig): Promise<EngineeringFacts> {
  const f = config.fetch ?? (globalThis.fetch as unknown as FetchLike);
  const timeout = config.timeoutMs ?? 5000;
  const asOf = (config.now ?? (() => new Date()))().toISOString();

  const github = async (): Promise<EngineeringFacts["github"]> => {
    const token = config.github?.token;
    const repo = config.github?.repository;
    if (!token || !repo) return notConnected("GitHub read token or repository is not configured (COMPANY_OS_GITHUB_TOKEN / COMPANY_OS_GITHUB_REPO).");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return unavailable("Configured GitHub repository is not in owner/name form.");
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "rinads-company-os" };
    try {
      const pulls = (await get(f, `https://api.github.com/repos/${repo}/pulls?state=open&per_page=30`, headers, timeout)) as { number: number; title: string; head: { sha: string } }[];
      const failing: { pr: number; title: string; check: string }[] = [];
      for (const pr of pulls.slice(0, 10)) {
        const runs = (await get(f, `https://api.github.com/repos/${repo}/commits/${pr.head.sha}/check-runs?per_page=50`, headers, timeout)) as { check_runs?: { name: string; conclusion: string | null }[] };
        for (const run of runs.check_runs ?? []) if (run.conclusion && ["failure", "timed_out", "cancelled", "action_required"].includes(run.conclusion)) failing.push({ pr: pr.number, title: pr.title, check: run.name });
      }
      const main = (await get(f, `https://api.github.com/repos/${repo}/commits/HEAD`, headers, timeout).catch(() => null)) as { sha?: string } | null;
      return available({ repository: repo, openPullRequests: pulls.length, failingChecks: failing, defaultBranchCommit: main?.sha ?? null }, asOf);
    } catch (e) {
      return unavailable(`GitHub could not be reached: ${reason(e)}`);
    }
  };

  const vercel = async (): Promise<EngineeringFacts["vercel"]> => {
    const token = config.vercel?.token;
    const projects = config.vercel?.projects ?? [];
    if (!token || projects.length === 0) return notConnected("Vercel read token or project list is not configured (COMPANY_OS_VERCEL_TOKEN / COMPANY_OS_VERCEL_PROJECTS).");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const rows = await Promise.all(
        projects.map(async (p) => {
          const q = new URLSearchParams({ projectId: p.id, target: "production", limit: "1" });
          if (config.vercel?.teamId) q.set("teamId", config.vercel.teamId);
          const body = (await get(f, `https://api.vercel.com/v6/deployments?${q}`, headers, timeout)) as { deployments?: { readyState?: string; state?: string; created?: number; meta?: { githubCommitSha?: string } }[] };
          const d = body.deployments?.[0];
          const state = d?.readyState ?? d?.state ?? "none";
          return { name: p.name, state, commitSha: d?.meta?.githubCommitSha ?? null, createdAt: d?.created ? new Date(d.created).toISOString() : null, ready: state === "READY" };
        })
      );
      return available({ projects: rows }, asOf);
    } catch (e) {
      return unavailable(`Vercel could not be reached: ${reason(e)}`);
    }
  };

  const supabase = async (): Promise<EngineeringFacts["supabase"]> => {
    const url = config.supabase?.url?.replace(/\/$/, "");
    const key = config.supabase?.anonKey;
    if (!url || !key) return notConnected("Supabase URL / anon key are not configured.");
    try {
      await get(f, `${url}/auth/v1/health`, { apikey: key }, timeout);
      // The applied-migration count needs the Management API (a separate, privileged token) and is intentionally not read.
      return available({ healthy: true, detail: "Auth service responded to its public health endpoint.", appliedMigrations: null }, asOf);
    } catch (e) {
      return available({ healthy: false, detail: `Auth health check failed: ${reason(e)}`, appliedMigrations: null }, asOf);
    }
  };

  const [gh, vc, sb] = await Promise.all([github(), vercel(), supabase()]);
  return { github: gh, vercel: vc, supabase: sb };
}

/** Parse "name:projectId,name2:projectId2" from an environment value. */
export function parseVercelProjects(value: string | undefined): { name: string; id: string }[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [name, id] = pair.split(":");
      return { name: (name ?? "").trim(), id: (id ?? "").trim() };
    })
    .filter((p) => p.name && p.id);
}

export type { Section };
