import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(process.cwd(), "../..");
const migration = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20261021130000_ai_credit_execution.sql"),
  "utf8"
);

describe("AI credit execution migration contract", () => {
  it("serializes balance-changing paths on the credit account", () => {
    assert.match(migration, /credit_reserve_units[\s\S]*credit_accounts[\s\S]*for update/i);
    assert.match(migration, /credit_capture_reservation[\s\S]*credit_accounts[\s\S]*for update/i);
    assert.match(migration, /credit_release_reservation[\s\S]*credit_accounts[\s\S]*for update/i);
  });

  it("keeps mutation RPCs service-role only", () => {
    assert.match(migration, /credit_reserve_units is service-role only/i);
    assert.match(migration, /credit_capture_reservation is service-role only/i);
    assert.match(migration, /credit_release_reservation is service-role only/i);
    assert.match(migration, /grant execute on function public\.credit_reserve_units[\s\S]*to service_role/i);
    assert.match(migration, /grant execute on function public\.credit_capture_reservation[\s\S]*to service_role/i);
  });

  it("fails closed on overspend and writes canonical evidence on capture", () => {
    assert.match(migration, /Insufficient RINADS credits/i);
    assert.match(migration, /billable_credits > v_reservation\.units/i);
    assert.match(migration, /insert into public\.credit_usage_events/i);
    assert.match(migration, /insert into public\.credit_ledger/i);
    assert.match(migration, /'consume'/i);
    assert.match(migration, /insert into public\.audit_logs/i);
    assert.match(migration, /insert into public\.business_events/i);
  });
});
