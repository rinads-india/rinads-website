import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

describe("core_identity migration", () => {
  const sql = readFileSync(
    join(process.cwd(), "../../supabase/migrations/20260814100001_core_identity.sql"),
    "utf8"
  );

  it("enables RLS on tenant tables", () => {
    for (const table of [
      "profiles",
      "organizations",
      "organization_members",
      "audit_logs",
      "feature_flags",
    ]) {
      assert.match(sql, new RegExp(`enable row level security`, "i"));
      assert.match(sql, new RegExp(`create table public\\.${table}`, "i"));
    }
  });

  it("blocks privileged self-assignment", () => {
    assert.match(sql, /prevent_privileged_role_assignment/);
    assert.match(sql, /founder/);
    assert.match(sql, /super_admin/);
  });

  it("seeds core permissions without CRM entities", () => {
    assert.match(sql, /org\.manage/);
    assert.doesNotMatch(sql, /create table public\.customers/i);
    assert.doesNotMatch(sql, /create table public\.invoices/i);
  });
});
