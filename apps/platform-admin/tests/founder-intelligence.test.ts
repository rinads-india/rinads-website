import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(
  new URL("../app/(founder)/founder-intelligence/page.tsx", import.meta.url),
  "utf8"
);
const layout = readFileSync(
  new URL("../app/(founder)/founder-intelligence/layout.tsx", import.meta.url),
  "utf8"
);
const adapters = readFileSync(
  new URL("../lib/founder-intelligence/adapters.ts", import.meta.url),
  "utf8"
);

describe("Founder Intelligence", () => {
  it("is server-gated to founder and platform-owner roles", () => {
    assert.match(layout, /loadPlatformAccess/);
    assert.match(layout, /roleKey !== "founder"/);
    assert.match(layout, /roleKey !== "super_admin"/);
    assert.match(layout, /redirect\("\/forbidden"\)/);
  });

  it("renders only adapter-backed status and an explicit disconnected state", () => {
    assert.match(page, /loadFounderIntelligenceSnapshot/);
    assert.match(page, /Not connected/);
    assert.match(page, /No forecasts or invented metrics/);
    assert.doesNotMatch(page, /98%|99\.9%|100%/);
  });

  it("promotes live RINPO approvals and provider state into the founder Today view", () => {
    assert.match(page, /loadRinpoControlSnapshot/);
    assert.match(page, /Pending approvals/);
    assert.match(page, /Pending RINPO actions/);
    assert.match(page, /RINPO provider/);
    assert.match(page, /Founder control tower/);
  });

  it("reads canonical operational tasks and alerts into Today and Attention", () => {
    assert.match(adapters, /operational_tasks/);
    assert.match(adapters, /operational_alerts/);
    assert.match(adapters, /loadFounderWork/);
    assert.match(adapters, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(page, /Open work/);
    assert.match(page, /Due today/);
    assert.match(page, /Work pulse/);
    assert.match(page, /Overdue work/);
    assert.match(page, /Blocked work/);
    assert.match(page, /Operational alerts/);
  });

  it("exposes per-project deployment truth and deterministic parity detection", () => {
    assert.match(adapters, /githubCommitSha/);
    assert.match(adapters, /githubCommitRef/);
    assert.match(adapters, /items/);
    assert.match(page, /Deployment parity mismatch/);
    assert.match(page, /websiteSha !== adminSha/);
  });

  it("keeps secrets server-only and marks missing integrations not connected", () => {
    assert.match(adapters, /import "server-only"/);
    assert.match(adapters, /FOUNDER_INTELLIGENCE_VERCEL_TOKEN/);
    assert.match(adapters, /RINPO_RUNTIME_HEALTH_URL/);
    assert.match(adapters, /state: "not_connected"/);
    assert.doesNotMatch(adapters, /NEXT_PUBLIC_.*TOKEN/);
  });

  it("ships the canonical transparent RINPO mascot with platform-admin", () => {
    const asset = new URL("../public/assets/rinpo-founder.png", import.meta.url);
    assert.equal(existsSync(asset), true);
    assert.match(page, /\/assets\/rinpo-founder\.png/);
  });
});
