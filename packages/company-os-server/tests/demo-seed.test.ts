import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { ROLE_PERMISSION_GRANTS, answerCompanyQuestion, buildFounderSnapshot, decideGovernedAction, detectBriefingIntent, type OrgContext } from "@rinads/company-os-engine";
import { admin, createDb, type Db, type Who } from "../../company-os-engine/tests/db/harness";
import { DEMO_ORG_ID, DEMO_OTHER_ORG_ID, PERSONAS, buildDemoSeedSql, personaId } from "../src/demo-seed";
import { createGovernedDeps, loadCompanyFacts } from "../src";
import { pgRowDb } from "./pg-rowdb";

let db: Db;
const as = (key: string): Who => ({ uid: personaId(key) });

before(async () => {
  db = await createDb();
  await db.exec(`select set_config('request.jwt.claims', '{"role":"service_role"}', false); select set_config('rinads.allow_demo_seed','yes', false);`);
  for (const p of PERSONAS) await db.query("insert into auth.users (id, email) values ($1,$2) on conflict do nothing", [personaId(p.key), p.email]);
  await db.exec(buildDemoSeedSql());
});
after(async () => db.close());

async function ctxFor(key: string, org = DEMO_ORG_ID): Promise<OrgContext> {
  const rows = await admin<{ role: string; perm: string | null }>(
    db,
    `select r.key as role, p.key as perm from organization_members m join roles r on r.id = m.role_id
       left join role_permissions rp on rp.role_id = r.id left join permissions p on p.id = rp.permission_id
      where m.user_id = $1 and m.organization_id = $2`,
    [personaId(key), org]
  );
  return { organizationId: org, userId: personaId(key), roleKey: rows[0].role, permissions: rows.map((r) => r.perm).filter((p): p is string => !!p) };
}

async function founderView(now = new Date()) {
  const ctx = await ctxFor("founder");
  const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as("founder")), ctx, organizationName: "RINADS Technologies — Preview Demo", now });
  const snap = buildFounderSnapshot(facts, now);
  const { rows } = await db.query<{ id: string; display_name: string }>("select id, display_name from cos_workers where organization_id = $1", [DEMO_ORG_ID]);
  return { facts, snap, names: new Map(rows.map((r) => [r.id, r.display_name])) };
}

describe("synthetic demo organisation", () => {
  it("is marked as demo and as a platform operator, with 14 departments and the persona memberships", async () => {
    const [org] = await admin<{ is_platform_operator: boolean }>(db, "select is_platform_operator from organizations where id = $1", [DEMO_ORG_ID]);
    assert.equal(org.is_platform_operator, true);
    const [pol] = await admin<{ policy_value: { environment: string } }>(db, "select policy_value from tenant_policies where organization_id = $1 and policy_key = 'environment'", [DEMO_ORG_ID]);
    assert.equal(pol.policy_value.environment, "demo");
    const [d] = await admin<{ n: number }>(db, "select count(*)::int as n from cos_departments where organization_id = $1", [DEMO_ORG_ID]);
    assert.equal(d.n, 14);
    const m = await admin<{ n: number }>(db, "select count(*)::int as n from organization_members where organization_id = $1", [DEMO_ORG_ID]);
    assert.equal(m[0].n, PERSONAS.filter((p) => p.org === "demo").length);
  });

  it("refuses to run on a database that has any other organisation (production safety)", async () => {
    const fresh = await createDb();
    try {
      await fresh.exec(`select set_config('request.jwt.claims', '{"role":"service_role"}', false); select set_config('rinads.allow_demo_seed','yes', false);`);
      await fresh.query("insert into public.organizations (id, name, slug) values ('11111111-1111-4111-8111-111111111111','Real Customer','real')");
      await assert.rejects(() => fresh.exec(buildDemoSeedSql()), /not a clean preview database/);
      await fresh.exec(`select set_config('rinads.allow_demo_seed','', false)`);
      await fresh.query("delete from public.organizations where slug = 'real'");
      await assert.rejects(() => fresh.exec(buildDemoSeedSql()), /Demo seed refused/);
    } finally {
      await fresh.close();
    }
  });

  it("founder tower: every section is available and the numbers are what the rows say", async () => {
    const { facts, snap } = await founderView();
    for (const key of ["tasks", "leads", "companies", "opportunities", "projects", "milestones", "invoices", "payments", "people", "approvals", "studioJobs", "aiRuns"] as const) {
      assert.equal(facts[key].state, "available", key);
    }
    const rec = snap.receivables;
    assert.equal(rec.state, "available");
    if (rec.state === "available") {
      // 75,000 (40 days overdue) + 30,000 (72 days) + 90,000 balance on INV-002 (5 days overdue)
      assert.equal(rec.data.totalOverdue, 75000 + 30000 + 90000);
    }
    const pipe = snap.pipeline;
    assert.equal(pipe.state, "available");
    if (pipe.state === "available") {
      assert.ok(pipe.data.openCount >= 4);
      assert.ok(pipe.data.weightedValue > 0);
      assert.ok(pipe.data.unpricedCount >= 1, "Harbor Coffee has no value yet and is excluded, not invented");
    }
    assert.equal(snap.approvals.state === "available" && snap.approvals.data.pending, 7);
    assert.ok(snap.approvals.state === "available" && snap.approvals.data.preparedByAgents >= 4);
    assert.ok(snap.projectRisk.state === "available" && snap.projectRisk.data.delayedMilestones >= 1);
    assert.ok(snap.work.state === "available" && snap.work.data.overdue >= 3 && snap.work.data.unassigned >= 2);
    assert.ok(snap.capacity.state === "available" && snap.capacity.data.overCapacity >= 1, "Kabir is booked at 46h of 40h");
    assert.ok(snap.cash.state === "available");
  });

  it("RINPO answers the twelve founder questions from this data (and never from thin air)", async () => {
    const { snap, names } = await founderView();
    const ask = (q: string) => answerCompanyQuestion(q, snap, { memberNames: names });
    const qs = [
      "How is RINADS today?",
      "What needs my attention?",
      "What needs my approval?",
      "Which clients are at risk?",
      "What work is overdue?",
      "Who is overloaded?",
      "What is due today?",
      "How is the sales pipeline?",
      "What invoices are overdue?",
      "What happened in engineering?",
      "How are campaigns performing?",
      "What should we prioritise tomorrow?",
    ];
    const intents = qs.map((q) => detectBriefingIntent(q));
    assert.deepEqual(intents, ["company_status", "attention", "approvals", "clients_at_risk", "work", "capacity", "work", "pipeline", "receivables", "engineering", "growth", "tomorrow"]);
    for (const q of qs) {
      const a = ask(q);
      assert.ok(a.headline.length > 0, q);
      assert.ok(a.text.length > 0, q);
    }
    assert.match(ask("What invoices are overdue?").text, /195,000|1,95,000/);
    assert.match(ask("Who is overloaded?").text, /Kabir/);
    assert.match(ask("What needs my approval?").text, /7 decisions waiting/);
  });

  it("the seeded pending approvals are real: the founder decides them through the governed pipeline; the deployment is honestly not executable", async () => {
    const ctx = await ctxFor("founder");
    const deps = createGovernedDeps(pgRowDb(db, as("founder")));
    const rows = await admin<{ id: string; idempotency_key: string; actor_kind: string }>(db, "select id, idempotency_key, actor_kind from rinpo_actions where organization_id = $1 and status = 'pending' order by idempotency_key", [DEMO_ORG_ID]);
    assert.equal(rows.length, 7);
    assert.ok(rows.some((r) => r.actor_kind === "agent") && rows.some((r) => r.actor_kind === "user"), "both human- and AI-prepared requests exist");
    const outcome: Record<string, string> = {};
    for (const r of rows) {
      const res = await decideGovernedAction(deps, { actionId: r.id, decision: "approve", approver: ctx });
      outcome[r.idempotency_key.replace("demo-seed:", "")] = res.status;
    }
    console.log("seeded approval outcomes:", JSON.stringify(outcome));
    assert.notEqual(outcome["pending-deploy"], "executed", "production deployment is never executable from the Company OS");
    assert.equal(ROLE_PERMISSION_GRANTS.founder.includes("approvals.decide"), true);
  });

  it("cross-tenant isolation: the other demo tenant's admin sees only its own rows; the demo staff never see the other tenant", async () => {
    const other = await ctxFor("otheradmin", DEMO_OTHER_ORG_ID);
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as("otheradmin")), ctx: other, organizationName: "Other", now: new Date() });
    const dump = JSON.stringify(facts);
    assert.ok(dump.includes("OTHER-TENANT-SECRET"));
    for (const s of ["Kerala Spice", "Lakshmi", "INV-DEMO", "Kabir"]) assert.ok(!dump.includes(s), s);
    const { facts: mine } = await loadCompanyFacts({ db: pgRowDb(db, as("founder")), ctx: await ctxFor("founder"), organizationName: "RINADS", now: new Date() });
    const mineDump = JSON.stringify(mine);
    assert.ok(!mineDump.includes("OTHER-TENANT-SECRET") && !mineDump.includes("OTHER-INV-999"));
  });

  it("role restrictions hold on the seeded data: staff cannot see finance; the client persona sees no Company OS data", async () => {
    const staff = await loadCompanyFacts({ db: pgRowDb(db, as("divya")), ctx: await ctxFor("divya"), organizationName: "RINADS", now: new Date() });
    assert.equal(staff.facts.invoices.state, "unavailable");
    assert.equal(staff.facts.payments.state, "unavailable");
    assert.equal(staff.facts.people.state, "unavailable");
    const snap = buildFounderSnapshot(staff.facts, new Date());
    assert.equal(snap.cash.state, "unavailable");
    assert.equal(snap.receivables.state, "unavailable");
    const client = await loadCompanyFacts({ db: pgRowDb(db, as("client")), ctx: await ctxFor("client"), organizationName: "RINADS", now: new Date() });
    for (const key of ["leads", "companies", "invoices", "projects", "people", "approvals"] as const) assert.equal(client.facts[key].state, "unavailable", key);
  });
});
