import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadEngineeringFacts, parseVercelProjects, type FetchLike } from "../src";

const res = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body });

describe("engineering signals", () => {
  it("fails closed: with no credentials every source reads 'not connected' and no request is made", async () => {
    let calls = 0;
    const f: FetchLike = async () => (calls++, res({}));
    const facts = await loadEngineeringFacts({ fetch: f });
    assert.equal(facts.github.state, "not_connected");
    assert.equal(facts.vercel.state, "not_connected");
    assert.equal(facts.supabase.state, "not_connected");
    assert.equal(calls, 0);
  });

  it("reads open PRs and failing checks from GitHub with a read-only bearer token", async () => {
    const seen: string[] = [];
    const f: FetchLike = async (url, init) => {
      seen.push(`${url}|${init?.headers?.Authorization}`);
      if (url.includes("/pulls?")) return res([{ number: 121, title: "Founder today", head: { sha: "abc" } }, { number: 119, title: "Runtime", head: { sha: "def" } }]);
      if (url.includes("/commits/abc/check-runs")) return res({ check_runs: [{ name: "lint", conclusion: "failure" }, { name: "build", conclusion: "success" }] });
      if (url.includes("/commits/def/check-runs")) return res({ check_runs: [{ name: "test", conclusion: "success" }, { name: "e2e", conclusion: null }] });
      if (url.endsWith("/commits/HEAD")) return res({ sha: "headsha" });
      return res({}, false, 404);
    };
    const facts = await loadEngineeringFacts({ fetch: f, github: { token: "ghp_secret", repository: "rinads-india/rinads-website" } });
    assert.equal(facts.github.state, "available");
    if (facts.github.state === "available") {
      assert.equal(facts.github.data.openPullRequests, 2);
      assert.deepEqual(facts.github.data.failingChecks, [{ pr: 121, title: "Founder today", check: "lint" }]);
      assert.equal(facts.github.data.defaultBranchCommit, "headsha");
    }
    assert.ok(seen.every((s) => s.endsWith("|Bearer ghp_secret")));
    assert.ok(seen.every((s) => s.startsWith("https://api.github.com/")), "only the GitHub API is contacted");
  });

  it("rejects a malformed repository value instead of building an arbitrary URL", async () => {
    const facts = await loadEngineeringFacts({ fetch: async () => res({}), github: { token: "t", repository: "../../evil?x=" } });
    assert.equal(facts.github.state, "unavailable");
  });

  it("marks non-READY Vercel production deployments and parses the project list", async () => {
    assert.deepEqual(parseVercelProjects(" www:prj_1 , admin:prj_2,bad,:x,y: "), [{ name: "www", id: "prj_1" }, { name: "admin", id: "prj_2" }]);
    const f: FetchLike = async (url) => {
      assert.ok(url.includes("target=production") && url.includes("teamId=team_1"));
      return url.includes("prj_1") ? res({ deployments: [{ readyState: "READY", created: 1_700_000_000_000, meta: { githubCommitSha: "aaa111" } }] }) : res({ deployments: [{ readyState: "ERROR", meta: { githubCommitSha: "bbb222" } }] });
    };
    const facts = await loadEngineeringFacts({ fetch: f, vercel: { token: "v", teamId: "team_1", projects: parseVercelProjects("www:prj_1,admin:prj_2") } });
    assert.equal(facts.vercel.state, "available");
    if (facts.vercel.state === "available") {
      assert.deepEqual(facts.vercel.data.projects.map((p) => [p.name, p.ready]), [["www", true], ["admin", false]]);
    }
  });

  it("never leaks a token into the error reason, and reports upstream failure as unavailable (not as healthy)", async () => {
    const f: FetchLike = async () => {
      throw new Error("connect failed Bearer ghp_supersecret");
    };
    const facts = await loadEngineeringFacts({ fetch: f, github: { token: "ghp_supersecret", repository: "a/b" } });
    assert.equal(facts.github.state, "unavailable");
    assert.ok(facts.github.state === "unavailable" && !facts.github.reason.includes("ghp_supersecret"));
  });

  it("an unhealthy Supabase auth endpoint is reported as unhealthy, never silently OK", async () => {
    const down = await loadEngineeringFacts({ fetch: async () => res({}, false, 503), supabase: { url: "https://x.supabase.co", anonKey: "anon" } });
    assert.equal(down.supabase.state === "available" && down.supabase.data.healthy, false);
    const up = await loadEngineeringFacts({ fetch: async () => res({ status: "ok" }), supabase: { url: "https://x.supabase.co/", anonKey: "anon" } });
    assert.equal(up.supabase.state === "available" && up.supabase.data.healthy, true);
    assert.equal(up.supabase.state === "available" && up.supabase.data.appliedMigrations, null, "applied-migration count needs a privileged token and is not guessed");
  });

  it("times out slow upstreams", async () => {
    const f: FetchLike = (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    const facts = await loadEngineeringFacts({ fetch: f, timeoutMs: 20, vercel: { token: "v", projects: [{ name: "www", id: "p" }] } });
    assert.equal(facts.vercel.state, "unavailable");
    assert.ok(facts.vercel.state === "unavailable" && /timed out/.test(facts.vercel.reason));
  });
});
