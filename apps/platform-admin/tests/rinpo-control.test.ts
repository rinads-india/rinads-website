import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../app/(founder)/rinpo/page.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/(founder)/rinpo/layout.tsx", import.meta.url), "utf8");
const adapters = readFileSync(new URL("../lib/rinpo-control/adapters.ts", import.meta.url), "utf8");

describe("RINPO production control", () => {
  it("is restricted to founder and super-admin roles", () => {
    assert.match(layout, /loadPlatformAccess/);
    assert.match(layout, /roleKey !== "founder"/);
    assert.match(layout, /roleKey !== "super_admin"/);
    assert.match(layout, /redirect\("\/forbidden"\)/);
  });

  it("uses live adapters and never substitutes demo operational counters", () => {
    assert.match(page, /loadRinpoControlSnapshot/);
    assert.match(page, /No invented health, usage or cost metrics/);
    assert.match(page, /metric\.value \?\? "—"/);
    assert.doesNotMatch(page, /98%|99\.9%|100% uptime|V30/);
  });

  it("reads canonical RINPO and runtime control tables server-side", () => {
    assert.match(adapters, /import "server-only"/);
    assert.match(adapters, /rinpo_conversations/);
    assert.match(adapters, /rinpo_memory_facts/);
    assert.match(adapters, /rinpo_actions/);
    assert.match(adapters, /runtime_approvals/);
    assert.match(adapters, /rinpo_audit_log/);
    assert.match(adapters, /rinpo_training_jobs/);
    assert.match(adapters, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(adapters, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("keeps the action safety lifecycle visible", () => {
    assert.match(page, /Identity/);
    assert.match(page, /Authorization/);
    assert.match(page, /Policy/);
    assert.match(page, /Approval/);
    assert.match(page, /Execution/);
    assert.match(page, /Audit \+ learning/);
    assert.match(page, /No direct model-to-production mutation path/);
  });

  it("shows provider routing configuration without rendering provider secrets", () => {
    assert.match(page, /Model routing configuration/);
    assert.match(page, /snapshot\.providerRoutes/);
    assert.match(page, /Canonical routing: @rinads\/intelligence/);
    assert.match(adapters, /RINADS_RINPO_LLM_PROVIDER/);
    assert.match(adapters, /RINADS_XAI_API_KEY/);
    assert.match(adapters, /RINADS_OPENAI_API_KEY/);
    assert.match(adapters, /selectedByDefault/);
    assert.doesNotMatch(page, /RINADS_XAI_API_KEY|RINADS_OPENAI_API_KEY|RINADS_RINPO_LLM_API_KEY/);
  });
});
