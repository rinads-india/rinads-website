import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const MIGRATION = join(
  process.cwd(),
  "../../supabase/migrations/20261005100000_platform_workspaces_locations.sql",
);

const sql = readFileSync(MIGRATION, "utf8");

describe("workspace + shared location foundation migration", () => {
  it("adds workspaces without replacing organization tenancy", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.workspaces/i);
    assert.match(sql, /organization_id UUID NOT NULL REFERENCES public\.organizations\(id\)/i);
    assert.match(sql, /UNIQUE \(organization_id, slug\)/i);
    assert.match(sql, /idx_workspaces_one_default_per_org/i);
  });

  it("backfills and auto-creates one default workspace per organization", () => {
    assert.match(sql, /INSERT INTO public\.workspaces[\s\S]*FROM public\.organizations/i);
    assert.match(sql, /is_default = true/i);
    assert.match(sql, /CREATE OR REPLACE FUNCTION private\.create_default_workspace_for_org/i);
    assert.match(sql, /AFTER INSERT ON public\.organizations/i);
  });

  it("enforces same-organization workspace/location linkage at database level", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.locations/i);
    assert.match(sql, /workspace_id UUID NOT NULL/i);
    assert.match(sql, /FOREIGN KEY \(workspace_id, organization_id\)/i);
    assert.match(sql, /REFERENCES public\.workspaces\(id, organization_id\)/i);
  });

  it("enables RLS and uses organization membership/permission gates", () => {
    assert.match(sql, /ALTER TABLE public\.workspaces ENABLE ROW LEVEL SECURITY/i);
    assert.match(sql, /ALTER TABLE public\.locations ENABLE ROW LEVEL SECURITY/i);
    assert.match(sql, /workspaces_select_member[\s\S]*private\.is_org_member\(organization_id\)/i);
    assert.match(sql, /workspaces_insert_manage[\s\S]*private\.has_permission\(organization_id, 'org\.manage'\)/i);
    assert.match(sql, /locations_select_member[\s\S]*private\.is_org_member\(organization_id\)/i);
    assert.match(sql, /locations_update_manage[\s\S]*private\.has_permission\(organization_id, 'org\.manage'\)/i);
  });

  it("does not introduce authenticated hard-delete policies", () => {
    assert.doesNotMatch(sql, /CREATE POLICY[^;]+FOR DELETE TO authenticated/is);
  });

  it("leaves legacy inventory and salon location schemas untouched in K2", () => {
    assert.doesNotMatch(sql, /ALTER TABLE\s+(?:public\.)?inventory_locations/i);
    assert.doesNotMatch(sql, /ALTER TABLE\s+(?:public\.)?salon_(?:branches|locations)/i);
  });
});
