import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { answerCompanyQuestion, buildFounderSnapshot, type OrgContext } from "@rinads/company-os-engine";
import { A, B, U, admin, as, createDb, seed, type Db, type Who } from "../../company-os-engine/tests/db/harness";
import { SCHEMA_PENDING, loadCompanyFacts } from "../src";
import { pgRowDb } from "./pg-rowdb";

const NOW = new Date();
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
const ahead = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();

let db: Db;
const W: Record<string, string> = {};

/** Resolve the caller's REAL role + permissions from the database, as the app's tenancy loader does. */
async function ctxFor(who: Who, org = A.org): Promise<OrgContext> {
  const rows = await admin<{ role: string; perm: string | null }>(
    db,
    `select r.key as role, p.key as perm from organization_members m join roles r on r.id = m.role_id
       left join role_permissions rp on rp.role_id = r.id left join permissions p on p.id = rp.permission_id
      where m.user_id = $1 and m.organization_id = $2`,
    [who.uid, org]
  );
  return { organizationId: org, userId: who.uid!, roleKey: rows[0].role, permissions: rows.map((r) => r.perm).filter((p): p is string => !!p) };
}

before(async () => {
  db = await createDb();
  await seed(db);
  // people (Business Graph workers; tasks, owners and decisions reference the worker id)
  const worker = async (user: string | null, name: string, extra = "") =>
    (await admin<{ id: string }>(db, `insert into cos_workers (organization_id, user_id, display_name ${extra ? ", role_title, skill_levels, available_hours_week" : ""}) values ($1,$2,$3 ${extra ? ", 'Lead', '{\"design\":5}'::jsonb, 20" : ""}) returning id`, [A.org, user, name]))[0].id;
  W.manager = await worker(U.managerA, "Mia Manager", "capacity");
  W.staff = await worker(U.staffA, "Sam Staff");
  const co = (await admin<{ id: string }>(db, "insert into cos_companies (organization_id, name, lifecycle_stage, priority) values ($1,'Acme Retail','client','strategic') returning id", [A.org]))[0].id;
  const proj = (await admin<{ id: string }>(db, "insert into cos_projects (organization_id, company_id, name, status, due_date) values ($1,$2,'Acme storefront','active', current_date + 20) returning id", [A.org, co]))[0].id;
  await admin(db, "insert into cos_milestones (organization_id, project_id, name, due_date, status) values ($1,$2,'Design sign-off', current_date - 3, 'active')", [A.org, proj]);
  // tasks: 1 overdue urgent (manager), 1 blocked, 1 due today unassigned high, 1 completed today
  await admin(db, "insert into cos_tasks (organization_id, title, status, priority, due_at, assignee_worker_id, project_id, estimate_hours) values ($1,'Ship Acme site','in_progress','critical',$2,$3,$4,30)", [A.org, ago(2), W.manager, proj]);
  await admin(db, "insert into cos_tasks (organization_id, title, status, priority, assignee_worker_id) values ($1,'Waiting on assets','waiting','normal',$2)", [A.org, W.staff]);
  await admin(db, "insert into cos_tasks (organization_id, title, status, priority, due_at) values ($1,'Unowned hot task','todo','high',$2)", [A.org, new Date(NOW.getTime() + 60_000).toISOString()]);
  await admin(db, "insert into cos_tasks (organization_id, title, status, priority) values ($1,'Done today','done','low')", [A.org]);
  // sales
  await admin(db, "insert into cos_leads (organization_id, title, status, created_at) values ($1,'Old uncontacted','new',$2)", [A.org, ago(5)]);
  await admin(db, "insert into cos_opportunities (organization_id, company_id, title, stage, amount, probability, stage_changed_at, expected_close_date) values ($1,$2,'Brand refresh','proposal',200000,60,$3,current_date - 2)", [A.org, co, ago(30)]);
  await admin(db, "insert into cos_opportunities (organization_id, title, stage, amount) values ($1,'Unpriced idea','discover',null)", [A.org]);
  // finance: 50,000 invoice 40 days overdue
  await admin(db, "insert into cos_invoices (organization_id, number, company_id, status, issued_at, due_at, amount) values ($1,'INV-OLD',$2,'sent', current_date - 70, current_date - 40, 50000)", [A.org, co]);
  // a pending HIGH approval prepared by an AI role
  await admin(db, `insert into rinpo_actions (organization_id, user_id, action_type, input, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, distinct_approver, approver_permission, expires_at, actor_kind, agent_role, created_at)
     values ($1,$2,'invoice.issue','{"invoiceId":"x","number":"INV-NEW"}','pending','company-os','e2e-1','HIGH','h',true,false,'approvals.decide', now() + interval '1 day','agent','operations_controller', now() - interval '30 hours')`, [A.org, U.managerA]);
  // other tenant's data must never appear
  await admin(db, "insert into cos_companies (organization_id, name) values ($1,'Globex Secret Corp')", [B.org]);
  await admin(db, "insert into cos_tasks (organization_id, title, status, priority, due_at) values ($1,'B overdue',  'todo','critical',$2)", [B.org, ago(9)]);
  await admin(db, "insert into cos_invoices (organization_id, number, status, issued_at, due_at, amount) values ($1,'B-SECRET','sent', current_date - 90, current_date - 80, 999999)", [B.org]);
});
after(async () => db.close());

describe("How is RINADS today? — from real, permission-filtered data", () => {
  it("founder: facts → snapshot → answer reproduce the seeded company exactly", async () => {
    const ctx = await ctxFor(as.founderA);
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.founderA), ctx, organizationName: "RINADS", now: NOW });
    for (const key of ["tasks", "leads", "companies", "opportunities", "projects", "milestones", "invoices", "payments", "people", "approvals"] as const) {
      assert.equal(facts[key].state, "available", key);
    }
    const snap = buildFounderSnapshot(facts, NOW);
    assert.equal(snap.work.state === "available" && snap.work.data.open, 3);
    assert.equal(snap.work.state === "available" && snap.work.data.overdue, 1);
    assert.equal(snap.work.state === "available" && snap.work.data.blocked, 1);
    assert.equal(snap.work.state === "available" && snap.work.data.unassigned, 1);
    assert.equal(snap.receivables.state === "available" && snap.receivables.data.totalOverdue, 50000);
    assert.equal(snap.pipeline.state === "available" && snap.pipeline.data.openCount, 2);
    assert.equal(snap.pipeline.state === "available" && snap.pipeline.data.weightedValue, 120000, "200000 × 60% explicit; unpriced deal excluded");
    assert.equal(snap.pipeline.state === "available" && snap.pipeline.data.unpricedCount, 1);
    assert.equal(snap.approvals.state === "available" && snap.approvals.data.pending, 1);
    assert.equal(snap.approvals.state === "available" && snap.approvals.data.preparedByAgents, 1);
    assert.equal(snap.projectRisk.state === "available" && snap.projectRisk.data.delayedMilestones, 1);
    assert.equal(snap.clientRisk.state === "available" && snap.clientRisk.data[0]?.companyName, "Acme Retail");
    assert.equal(snap.capacity.state === "available" && snap.capacity.data.overCapacity, 1, "30h committed vs 20h capacity");
    assert.equal(snap.dailyClose.tasksCompleted, 1);

    const names = new Map([[W.manager, "Mia Manager"], [W.staff, "Sam Staff"]]);
    const answer = answerCompanyQuestion("How is RINADS today?", snap, { memberNames: names });
    assert.match(answer.headline, /critical item/);
    assert.ok(answer.atRisk.some((r) => r.title.includes("overdue task") && r.owners.includes("Mia Manager")));
    assert.ok(answer.atRisk.some((r) => r.title.includes("overdue invoice")));
    assert.ok(answer.text.includes("50,000"));
    assert.ok(answer.canExecute.length + answer.requiresApproval.length > 0);
    assert.match(answer.text, /prepared by operations_controller/);
  });

  it("another tenant's data never appears for the founder (no Globex, no B invoice, no B task)", async () => {
    const ctx = await ctxFor(as.founderA);
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.founderA), ctx, organizationName: "RINADS", now: NOW });
    const dump = JSON.stringify(facts);
    for (const secret of ["Globex Secret Corp", "B-SECRET", "999999", "B overdue"]) assert.ok(!dump.includes(secret), secret);
  });

  it("the other tenant sees only its own facts", async () => {
    const ctx = await ctxFor(as.adminB, B.org);
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.adminB), ctx, organizationName: "Other B", now: NOW });
    const dump = JSON.stringify(facts);
    assert.ok(dump.includes("Globex Secret Corp"));
    assert.ok(!dump.includes("Acme Retail") && !dump.includes("INV-OLD") && !dump.includes("Ship Acme site"));
    const snap = buildFounderSnapshot(facts, NOW);
    assert.equal(snap.receivables.state === "available" && snap.receivables.data.totalOverdue, 999999);
  });

  it("staff cannot see finance: sections are unavailable, no numbers are produced, and the answer says so", async () => {
    const ctx = await ctxFor(as.staffA);
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.staffA), ctx, organizationName: "RINADS", now: NOW });
    assert.equal(facts.invoices.state, "unavailable");
    assert.equal(facts.payments.state, "unavailable");
    assert.equal(facts.people.state, "unavailable");
    const snap = buildFounderSnapshot(facts, NOW);
    assert.equal(snap.cash.state, "unavailable");
    const ans = answerCompanyQuestion("who owes us money?", snap);
    assert.match(ans.headline, /cannot be summarised/);
    assert.ok(!ans.text.includes("50,000"));
    assert.ok(!JSON.stringify(facts).includes("INV-OLD"));
  });

  it("a client-role member gets no Company OS facts", async () => {
    const ctx = await ctxFor(as.clientA);
    const { facts } = await loadCompanyFacts({ db: pgRowDb(db, as.clientA), ctx, organizationName: "RINADS", now: NOW });
    for (const key of ["leads", "companies", "opportunities", "invoices", "payments", "projects", "people", "approvals", "studioJobs", "aiRuns"] as const) {
      assert.equal(facts[key].state, "unavailable", key);
    }
  });

  it("a database with only the kernel (extension migrations not applied) degrades honestly: every graph section says migrations are pending, nothing is half-mapped", async () => {
    const old = await createDb({ stopBeforeCompanyOs: true });
    try {
      await old.exec(`select set_config('request.jwt.claims','{"role":"service_role"}', false)`);
      // minimal seed in the old schema
      await old.query("insert into auth.users (id) values ($1)", [U.founderA]);
      await old.query("insert into public.organizations (id, name, slug) values ($1,'RINADS','r')", [A.org]);
      await old.query("insert into public.organization_members (organization_id,user_id,role_id,status) select $1,$2,id,'active' from roles where key='founder'", [A.org, U.founderA]);
      await old.query("insert into cos_tasks (organization_id,title,status,priority) values ($1,'Kernel-only task','todo','normal')", [A.org]);
      const { run } = await import("../../company-os-engine/tests/db/harness");
      void run;
      const rowdb = pgRowDb(old, as.founderA);
      const { facts } = await loadCompanyFacts({ db: rowdb, ctx: { organizationId: A.org, userId: U.founderA, roleKey: "founder", permissions: [] }, organizationName: "RINADS", now: NOW });
      for (const key of ["tasks", "leads", "invoices", "projects", "approvals", "studioJobs", "aiRuns", "people"] as const) {
        const s = facts[key];
        assert.equal(s.state, "unavailable", key);
        assert.equal(s.state === "unavailable" && s.reason, SCHEMA_PENDING, key);
      }
      const snap = buildFounderSnapshot(facts, NOW);
      assert.equal(snap.work.state, "unavailable", "no work numbers are produced from a half-applied schema");
      assert.ok(snap.pulse.sectionsUnavailable.includes("receivables"));
    } finally {
      await old.close();
    }
  });
});
