import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Runtime RLS policies", () => {
  it("migration enables org-scoped RLS on runtime tables", () => {
    const sql = readFileSync(
      join(process.cwd(), "../../supabase/migrations/20260818100000_runtime_2.sql"),
      "utf8"
    );
    assert.match(sql, /runtime_jobs ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /notification_outbox ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /runtime_approvals ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /private\.is_org_member\(organization_id\)/);
  });

  it("Phase 13 migration adds execution snapshots and claim RPC", () => {
    const sql = readFileSync(
      join(process.cwd(), "../../supabase/migrations/20260819100000_runtime_worker_persistence.sql"),
      "utf8"
    );
    assert.match(sql, /runtime_execution_snapshots/);
    assert.match(sql, /claim_runtime_jobs/);
    assert.match(sql, /reset_stale_runtime_jobs/);
  });
});
