import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sql = readFileSync(join(process.cwd(), "../../supabase/migrations/20260916100000_salon_loyalty.sql"), "utf8");

describe("salon loyalty migration", () => {
  it("creates all tenant-owned tables with RLS", () => {
    for (const table of ["salon_loyalty_programs", "salon_loyalty_accounts", "salon_loyalty_ledger_entries", "salon_loyalty_redemptions"]) {
      assert.match(sql, new RegExp(`CREATE TABLE ${table}`, "i"));
      assert.match(sql, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, "i"));
      assert.match(sql, new RegExp(`${table}[\\s\\S]*organization_id UUID NOT NULL REFERENCES organizations`, "i"));
    }
  });

  it("uses org-scoped idempotency keys and tenant-safe composite foreign keys", () => {
    assert.match(sql, /UNIQUE \(organization_id, idempotency_key\)/);
    assert.match(sql, /FOREIGN KEY \(organization_id, account_id\) REFERENCES salon_loyalty_accounts\(organization_id, id\)/);
  });

  it("keeps the ledger append-only", () => {
    assert.doesNotMatch(sql, /CREATE POLICY salon_loyalty_ledger\S* (?:FOR )?(?:UPDATE|DELETE)/i);
    assert.match(sql, /No UPDATE\/DELETE policy exists on ledger_entries/i);
  });

  it("locks balances, prevents overspending, and makes redemption idempotent", () => {
    assert.match(sql, /salon_loyalty_accounts[\s\S]*FOR UPDATE/);
    assert.match(sql, /IF v_balance < p_points THEN RAISE EXCEPTION 'insufficient loyalty points'/);
    assert.match(sql, /salon_loyalty_redemptions WHERE organization_id=p_organization_id AND idempotency_key=p_idempotency_key/);
  });

  it("hooks paid sales and processed refunds idempotently", () => {
    assert.match(sql, /NEW\.status='paid' AND OLD\.status IS DISTINCT FROM 'paid'/);
    assert.match(sql, /NEW\.status='processed' AND OLD\.status IS DISTINCT FROM 'processed'/);
    assert.match(sql, /'sale-earn:'\|\|NEW\.id/);
    assert.match(sql, /'refund-reversal:'\|\|NEW\.id/);
  });
});
