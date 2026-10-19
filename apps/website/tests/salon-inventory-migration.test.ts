import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const sql = readFileSync(
  join(process.cwd(), "../../supabase/migrations/20261019140000_salon_inventory.sql"),
  "utf8"
);

describe("salon inventory migration (20261019140000)", () => {
  it("creates tenant-scoped inventory tables with RLS", () => {
    for (const table of [
      "salon_products",
      "salon_stock_levels",
      "salon_stock_transfers",
      "salon_stock_transfer_lines",
      "salon_stock_movements",
    ]) {
      assert.match(sql, new RegExp(`create table if not exists public.${table}`, "i"));
      assert.match(sql, new RegExp(`alter table public.${table} enable row level security`, "i"));
    }
    assert.match(sql, /organization_id UUID NOT NULL REFERENCES public\.organizations/i);
    assert.doesNotMatch(sql, /DROP TABLE/i);
  });

  it("keeps transfers atomic and idempotent via SECURITY DEFINER RPCs", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.transfer_salon_stock/i);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.adjust_salon_stock/i);
    assert.match(sql, /idempotent_replay/);
    assert.match(sql, /insufficient stock/);
    assert.match(sql, /salon\.inventory\.manage/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.transfer_salon_stock[\s\S]*TO authenticated/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.transfer_salon_stock[\s\S]*FROM PUBLIC, anon, service_role/);
  });

  it("does not reuse owner-portal ERP or demo inventory tables", () => {
    assert.doesNotMatch(sql, /product_variants|stock_ledger|USE_DEMO_STORE|mongodb/i);
  });
});
