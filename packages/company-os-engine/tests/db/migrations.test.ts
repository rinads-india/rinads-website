import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { COMPANY_OS_PERMISSIONS, ROLE_PERMISSION_GRANTS } from "../../src";
import { applyCompanyOsMigrations, companyOsMigrationFiles, createDb, readCompanyOsSql, type Db } from "./harness";

const EXPECTED_TABLES = [
  "academy_progress", "academy_skills", "ad_campaigns", "ad_metrics_daily", "ai_agent_profiles", "ai_runs",
  "asset_performance", "asset_publications", "comm_activities", "content_items", "creative_assets",
  "crm_companies", "crm_contacts", "crm_contracts", "crm_leads", "crm_opportunities", "crm_proposals",
  "deliverables", "finance_invoices", "finance_payments", "growth_campaigns", "people_profiles",
  "project_milestones", "projects", "studio_jobs", "work_assignment_decisions",
];

describe("Company OS migrations — static safety rules", () => {
  const files = readCompanyOsSql();

  it("ships the seven additive migrations in dependency order", () => {
    assert.deepEqual(companyOsMigrationFiles(), [
      "20261016120000_company_os_permissions.sql",
      "20261016120100_company_os_ledger_events.sql",
      "20261016120200_company_os_crm_sales.sql",
      "20261016120300_company_os_delivery_finance.sql",
      "20261016120400_company_os_people_work.sql",
      "20261016120500_company_os_studio_growth.sql",
      "20261016120600_company_os_comms_academy_ai.sql",
    ]);
  });

  for (const { file, sql } of files) {
    const code = sql.replace(/--.*$/gm, "");
    describe(file, () => {
      it("adds no SECURITY DEFINER function (PR #115 privilege-drift class)", () => {
        assert.doesNotMatch(code, /security\s+definer/i);
      });
      it("never grants anything to anon", () => {
        assert.doesNotMatch(code, /grant\b[^;]*\bto\b[^;]*\banon\b/i);
      });
      it("is additive: no DROP TABLE/COLUMN/SCHEMA/CONSTRAINT/POLICY, no TRUNCATE, no unscoped DELETE/UPDATE", () => {
        assert.doesNotMatch(code, /drop\s+(table|column|schema|constraint|policy|function|type|index)\b/i);
        assert.doesNotMatch(code, /\btruncate\s+(table\s+)?[a-z_."]+\s*;/i);
        assert.doesNotMatch(code, /\bdelete\s+from\b/i);
        assert.doesNotMatch(code, /\bupdate\s+public\.[a-z_]+\s+set\b/i);
      });
      it("uses IF NOT EXISTS / ON CONFLICT so it is safe to re-run where re-run is meaningful", () => {
        for (const m of code.matchAll(/create\s+table\s+(?!if\s+not\s+exists)/gi)) assert.fail(`CREATE TABLE without IF NOT EXISTS: ${m[0]}`);
        for (const m of code.matchAll(/add\s+column\s+(?!if\s+not\s+exists)/gi)) assert.fail(`ADD COLUMN without IF NOT EXISTS: ${m[0]}`);
        for (const m of code.matchAll(/create\s+(unique\s+)?index\s+(?!if\s+not\s+exists)/gi)) assert.fail(`CREATE INDEX without IF NOT EXISTS: ${m[0]}`);
      });
      it("names every policy with the cos_ prefix", () => {
        const direct = [...code.matchAll(/create\s+policy\s+([a-z_0-9]+)/gi)].map((m) => m[1]);
        for (const name of direct) assert.match(name, /^cos_/, name);
      });
    });
  }

  it("every table is organisation-scoped (organization_id NOT NULL referencing organizations)", () => {
    const all = files.map((f) => f.sql).join("\n");
    for (const table of EXPECTED_TABLES) {
      const m = new RegExp(`create table if not exists public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, "i").exec(all);
      assert.ok(m, `table ${table} not found`);
      assert.match(m![1], /organization_id uuid NOT NULL REFERENCES public\.organizations \(id\) ON DELETE CASCADE/i, table);
    }
  });
});

describe("Company OS migrations — applied to the real migration chain", () => {
  let db: Db;
  let before_: { tables: Set<string>; policies: Set<string>; definerFns: Set<string>; anonDefiner: Set<string> };
  let after_: typeof before_;

  async function snapshot() {
    const tables = await db.query<{ t: string }>("select tablename as t from pg_tables where schemaname='public'");
    const policies = await db.query<{ p: string }>("select tablename || '.' || policyname as p from pg_policies where schemaname='public'");
    const definer = await db.query<{ f: string }>("select p.oid::regprocedure::text as f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prosecdef");
    const anonDefiner = await db.query<{ f: string }>("select p.oid::regprocedure::text as f from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE')");
    return {
      tables: new Set(tables.rows.map((r) => r.t)),
      policies: new Set(policies.rows.map((r) => r.p)),
      definerFns: new Set(definer.rows.map((r) => r.f)),
      anonDefiner: new Set(anonDefiner.rows.map((r) => r.f)),
    };
  }

  before(async () => {
    db = await createDb({ stopBeforeCompanyOs: true });
    before_ = await snapshot();
    await applyCompanyOsMigrations(db);
    after_ = await snapshot();
  });
  after(async () => db.close());

  it("creates exactly the planned tables", () => {
    const created = [...after_.tables].filter((t) => !before_.tables.has(t)).sort();
    assert.deepEqual(created, [...EXPECTED_TABLES].sort());
  });

  it("enables RLS and defines at least one policy on every new table; anon has zero privileges", async () => {
    for (const table of EXPECTED_TABLES) {
      const rls = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid = ('public.' || $1)::regclass", [table]);
      assert.equal(rls.rows[0].relrowsecurity, true, `${table}: RLS must be enabled`);
      const pol = await db.query<{ n: number }>("select count(*)::int as n from pg_policies where schemaname='public' and tablename=$1", [table]);
      assert.ok(pol.rows[0].n >= 1, `${table}: needs at least one policy`);
      const anon = await db.query<{ ok: boolean }>("select has_table_privilege('anon', ('public.' || $1)::regclass, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') as ok", [table]);
      assert.equal(anon.rows[0].ok, false, `${table}: anon must have no privileges`);
      for (const priv of ["DELETE", "TRUNCATE"]) {
        const r = await db.query<{ ok: boolean }>("select has_table_privilege('authenticated', ('public.' || $1)::regclass, $2) as ok", [table, priv]);
        assert.equal(r.rows[0].ok, false, `${table}: authenticated must not have ${priv}`);
      }
    }
  });

  it("every SELECT policy on a new table is tenant- and permission-scoped", async () => {
    const rows = await db.query<{ tablename: string; policyname: string; qual: string; permissive: string }>(
      "select tablename, policyname, qual, permissive from pg_policies where schemaname='public' and cmd='SELECT' and policyname like 'cos\\_%'"
    );
    assert.ok(rows.rows.length > 20);
    for (const r of rows.rows) {
      assert.match(r.qual, /organization_id/, `${r.policyname} must reference organization_id`);
      assert.match(r.qual, /has_permission|is_org_member|auth\.uid\(\)/, `${r.policyname} must check membership/permission`);
    }
  });

  it("every INSERT/UPDATE policy requires a permission check (no bare membership writes except own AI-run/event logging)", async () => {
    const rows = await db.query<{ policyname: string; cmd: string; qual: string | null; with_check: string | null }>(
      "select policyname, cmd, qual, with_check from pg_policies where schemaname='public' and cmd in ('INSERT','UPDATE') and policyname like 'cos\\_%'"
    );
    const memberOnly = new Set(["cos_ai_runs_insert", "cos_business_events_insert", "cos_audit_logs_insert_guard", "cos_rinpo_actions_update", "cos_rinpo_actions_insert_guard"]);
    for (const r of rows.rows) {
      if (memberOnly.has(r.policyname)) continue;
      const text = `${r.qual ?? ""} ${r.with_check ?? ""}`;
      assert.match(text, /has_permission/, `${r.policyname} must require a permission`);
    }
  });

  it("introduces no SECURITY DEFINER function and no new anonymous SECURITY DEFINER exposure", () => {
    assert.deepEqual([...after_.definerFns].filter((f) => !before_.definerFns.has(f)), []);
    assert.deepEqual([...after_.anonDefiner].sort(), [...before_.anonDefiner].sort());
  });

  it("preserves every pre-existing table and policy (purely additive)", () => {
    for (const t of before_.tables) assert.ok(after_.tables.has(t), `lost table ${t}`);
    for (const p of before_.policies) assert.ok(after_.policies.has(p), `lost policy ${p}`);
  });

  it("DB role grants for Company OS permissions match packages/company-os ROLE_PERMISSION_GRANTS exactly", async () => {
    const rows = await db.query<{ role: string; perm: string }>(
      "select r.key as role, p.key as perm from role_permissions rp join roles r on r.id = rp.role_id join permissions p on p.id = rp.permission_id where p.key = any($1)",
      [COMPANY_OS_PERMISSIONS as unknown as string[]]
    );
    const actual = new Map<string, Set<string>>();
    for (const r of rows.rows) (actual.get(r.role) ?? actual.set(r.role, new Set()).get(r.role)!).add(r.perm);
    for (const [role, grants] of Object.entries(ROLE_PERMISSION_GRANTS)) {
      assert.deepEqual([...(actual.get(role) ?? [])].sort(), [...grants].sort(), `role ${role}`);
    }
    const seeded = await db.query<{ key: string }>("select key from permissions where key = any($1)", [COMPANY_OS_PERMISSIONS as unknown as string[]]);
    assert.equal(seeded.rows.length, COMPANY_OS_PERMISSIONS.length);
  });

  it("every cross-table link is a composite (organization_id, id) FK — a child can never reference another tenant's parent", async () => {
    const rows = await db.query<{ conrelid: string; def: string }>(
      "select conrelid::regclass::text as conrelid, pg_get_constraintdef(oid) as def from pg_constraint where contype='f' and connamespace='public'::regnamespace and conrelid::regclass::text = any($1)",
      [EXPECTED_TABLES]
    );
    const single = rows.rows.filter((r) => /REFERENCES (public\.)?(crm_|projects|project_|growth_|studio_|creative_|content_|asset_|ad_|finance_|deliverables|academy_skills)/.test(r.def) && !/\(organization_id/.test(r.def));
    assert.deepEqual(single, [], "cross-links must be composite");
  });
});
