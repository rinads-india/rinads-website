import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const REPO_ROOT = join(process.cwd(), "../..");
const sql = readFileSync(
  join(REPO_ROOT, "supabase/migrations/20261021150000_business_cloud_v2_privilege_hardening.sql"),
  "utf8",
);

describe("Business Cloud V2 Supabase privilege hardening", () => {
  it("removes anonymous access from credit, finance and India compliance tables", () => {
    assert.match(sql, /revoke all on table public\.credit_accounts from anon/i);
    assert.match(sql, /finance_accounts[\s\S]*from anon/i);
    assert.match(sql, /india_gst_registrations[\s\S]*from anon/i);
  });

  it("keeps provider-cost evidence internal", () => {
    assert.match(sql, /revoke all on table public\.credit_usage_events from authenticated/i);
    assert.match(sql, /credit_usage_events[\s\S]*to service_role/i);
  });

  it("makes credit execution RPCs service-role only", () => {
    assert.match(
      sql,
      /revoke execute on function public\.credit_reserve_units[\s\S]*from public, anon, authenticated, service_role/i,
    );
    assert.match(
      sql,
      /grant execute on function public\.credit_reserve_units[\s\S]*to service_role/i,
    );
    assert.match(
      sql,
      /grant execute on function public\.credit_capture_reservation[\s\S]*to service_role/i,
    );
  });

  it("explicitly clears broad finance posting execution before regranting intended roles", () => {
    assert.match(
      sql,
      /revoke execute on function public\.finance_post_entry\(uuid, uuid\)[\s\S]*from public, anon, authenticated, service_role/i,
    );
    assert.match(
      sql,
      /grant execute on function public\.finance_post_entry\(uuid, uuid\)[\s\S]*to authenticated, service_role/i,
    );
  });

  it("does not grant authenticated mutation of append-only tax evidence", () => {
    assert.match(sql, /grant select, insert[\s\S]*india_tax_transaction_evidence[\s\S]*to authenticated/i);
    assert.match(sql, /revoke update on table public\.india_tax_transaction_evidence from authenticated/i);
  });
});
