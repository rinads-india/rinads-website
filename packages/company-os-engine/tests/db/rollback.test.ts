import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import { applyCompanyOsMigrations, createDb, type Db } from "./harness";

const here = dirname(fileURLToPath(import.meta.url));
const ROLLBACK = readFileSync(join(here, "../../../../supabase/rollback/20261016130000_company_os_rollback.sql"), "utf8");

async function fingerprint(db: Db) {
  const q = async (sql: string) => (await db.query<{ v: string }>(sql)).rows.map((r) => r.v).sort();
  return {
    tables: await q("select tablename as v from pg_tables where schemaname='public'"),
    columns: await q("select table_name || '.' || column_name || ':' || coalesce(column_default, '') || ':' || is_nullable as v from information_schema.columns where table_schema='public' and (table_name like 'cos\\_%' or table_name in ('rinpo_actions','operational_tasks','business_events','audit_logs'))"),
    constraints: await q("select conrelid::regclass::text || '.' || conname || ':' || pg_get_constraintdef(oid) as v from pg_constraint where connamespace='public'::regnamespace and conrelid::regclass::text like 'cos\\_%'"),
    policies: await q("select tablename || '.' || policyname as v from pg_policies where schemaname in ('public')"),
    triggers: await q("select event_object_table || '.' || trigger_name as v from information_schema.triggers where trigger_schema='public'"),
    functions: await q("select p.oid::regprocedure::text as v from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')"),
    indexes: await q("select indexname as v from pg_indexes where schemaname='public'"),
    permissions: await q("select key as v from permissions"),
    rolePerms: await q("select r.key || ':' || p.key as v from role_permissions rp join roles r on r.id=rp.role_id join permissions p on p.id=rp.permission_id"),
  };
}

describe("Company OS rollback", () => {
  let db: Db;
  let baseline: Awaited<ReturnType<typeof fingerprint>>;
  before(async () => {
    db = await createDb({ stopBeforeCompanyOs: true });
    baseline = await fingerprint(db);
  });
  after(async () => db.close());

  it("apply → rollback restores the exact pre-Company-OS database", async () => {
    await applyCompanyOsMigrations(db);
    const applied = await fingerprint(db);
    assert.ok(applied.tables.length > baseline.tables.length);
    await db.exec(ROLLBACK);
    assert.deepEqual(await fingerprint(db), baseline);
  });

  it("migrations can be re-applied after a rollback (round trip)", async () => {
    await applyCompanyOsMigrations(db);
    const reapplied = await fingerprint(db);
    assert.ok(reapplied.tables.includes("creative_assets"));
    assert.ok(reapplied.policies.includes("rinpo_actions.cos_rinpo_actions_update"));
  });
});
