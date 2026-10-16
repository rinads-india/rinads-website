import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { A, B, U, admin, as, createDb, denied, peek, run, seed, type Db } from "./harness";

let db: Db;
let coA: string;
let coB: string;

before(async () => {
  db = await createDb();
  await seed(db);
  coA = (await admin<{ id: string }>(db, "insert into cos_companies (organization_id, name) values ($1, 'Acme A') returning id", [A.org]))[0].id;
  coB = (await admin<{ id: string }>(db, "insert into cos_companies (organization_id, name) values ($1, 'Globex B') returning id", [B.org]))[0].id;
});
after(async () => db.close());

describe("tenant isolation", () => {
  it("members only ever see their own organisation's rows", async () => {
    const a = await peek<{ name: string }>(db, as.adminA, "select name from cos_companies order by name");
    assert.deepEqual(a.map((r) => r.name), ["Acme A"]);
    const b = await peek<{ name: string }>(db, as.adminB, "select name from cos_companies order by name");
    assert.deepEqual(b.map((r) => r.name), ["Globex B"]);
  });

  it("a user with no membership sees nothing", async () => {
    assert.equal((await peek(db, as.outsider, "select * from cos_companies")).length, 0);
  });

  it("anonymous users cannot read or write Company OS tables", async () => {
    for (const t of ["cos_companies", "cos_invoices", "ai_runs", "cos_projects", "creative_assets", "cos_workers", "cos_payments"]) {
      assert.match((await denied(db, as.anon, `select * from ${t}`)) ?? "FAIL: allowed", /permission denied/i, t);
    }
    assert.match((await denied(db, as.anon, "insert into cos_companies (organization_id, name) values ($1, 'x')", [A.org])) ?? "FAIL", /permission denied/i);
  });

  it("cannot insert into another tenant", async () => {
    const err = await denied(db, as.adminA, "insert into cos_companies (organization_id, name) values ($1, 'Smuggled')", [B.org]);
    assert.match(err ?? "FAIL: allowed", /row-level security/i);
  });

  it("cannot move a row to another tenant by updating organization_id", async () => {
    const err = await denied(db, as.adminA, "update cos_companies set organization_id = $1 where id = $2", [B.org, coA]);
    assert.ok(err, "must be rejected");
  });

  it("cannot update or read another tenant's row by id", async () => {
    assert.equal((await peek(db, as.adminA, "select * from cos_companies where id = $1", [coB])).length, 0);
    const res = await peek(db, as.adminA, "update cos_companies set notes='x' where id = $1 returning id", [coB]);
    assert.equal(res.length, 0, "RLS makes the foreign row invisible to UPDATE");
  });

  it("composite foreign keys reject cross-tenant parents even for a legitimate in-tenant insert", async () => {
    const err = await denied(db, as.adminA, "insert into cos_contacts (organization_id, company_id, full_name) values ($1, $2, 'Eve')", [A.org, coB]);
    assert.match(err ?? "FAIL: allowed", /foreign key|violates/i);
    const ok = await peek(db, as.adminA, "insert into cos_contacts (organization_id, company_id, full_name) values ($1, $2, 'Eve') returning id", [A.org, coA]);
    assert.equal(ok.length, 1);
  });

  it("deliverables, tasks, workers and invoices cannot link to another tenant's parents", async () => {
    const projB = (await admin<{ id: string }>(db, "insert into cos_projects (organization_id, name) values ($1, 'B project') returning id", [B.org]))[0].id;
    const workerB = (await admin<{ id: string }>(db, "insert into cos_workers (organization_id, display_name) values ($1, 'B worker') returning id", [B.org]))[0].id;
    const e1 = await denied(db, as.adminA, "insert into cos_deliverables (organization_id, project_id, title) values ($1, $2, 'x')", [A.org, projB]);
    assert.match(e1 ?? "FAIL", /foreign key|violates/i);
    const e2 = await denied(db, as.managerA, "insert into cos_tasks (organization_id, title, project_id) values ($1, 't', $2)", [A.org, projB]);
    assert.match(e2 ?? "FAIL", /foreign key|violates/i);
    const e3 = await denied(db, as.managerA, "insert into cos_tasks (organization_id, title, assignee_worker_id) values ($1, 't', $2)", [A.org, workerB]);
    assert.match(e3 ?? "FAIL", /foreign key|violates/i, "cannot assign work to another tenant's person");
    const e4 = await denied(db, as.adminA, "insert into cos_invoices (organization_id, number, amount, company_id) values ($1, 'X-1', 5, $2)", [A.org, coB]);
    assert.match(e4 ?? "FAIL", /foreign key|violates/i);
  });

  it("no one (even a founder) can DELETE: records are retired by status", async () => {
    for (const who of [as.adminA, as.founderA]) {
      assert.match((await denied(db, who, "delete from cos_companies where id = $1", [coA])) ?? "FAIL", /permission denied/i);
    }
  });
});

describe("permission matrix inside one tenant (membership alone grants nothing)", () => {
  it("clients and viewers see no graph, finance, studio or ads data", async () => {
    for (const who of [as.clientA, as.viewerA]) {
      for (const t of ["cos_companies", "cos_leads", "cos_invoices", "cos_payments", "cos_expenses", "studio_jobs", "ad_metrics_daily", "cos_projects", "cos_tasks", "cos_workers", "cos_departments", "cos_attention_items", "cos_approval_items", "comm_activities"]) {
        assert.equal((await peek(db, who, `select * from ${t}`)).length, 0, `${t} for ${who.uid}`);
      }
    }
  });

  it("staff can read clients and sales but not write them; managers can write but cannot manage finance", async () => {
    assert.equal((await peek(db, as.staffA, "select * from cos_companies")).length, 1);
    assert.match((await denied(db, as.staffA, "insert into cos_companies (organization_id, name) values ($1, 'x')", [A.org])) ?? "FAIL", /row-level security/i);
    assert.match((await denied(db, as.staffA, "insert into cos_leads (organization_id, title) values ($1, 'x')", [A.org])) ?? "FAIL", /row-level security/i);
    assert.equal((await peek(db, as.managerA, "insert into cos_companies (organization_id, name) values ($1, 'Mgr Co') returning id", [A.org])).length, 1);
    assert.equal((await peek(db, as.managerA, "insert into cos_leads (organization_id, title) values ($1, 'Mgr lead') returning id", [A.org])).length, 1);
    assert.match((await denied(db, as.managerA, "insert into cos_invoices (organization_id, number, amount) values ($1, 'INV-1', 10)", [A.org])) ?? "FAIL", /row-level security/i);
    assert.match((await denied(db, as.managerA, "insert into cos_expenses (organization_id, amount) values ($1, 10)", [A.org])) ?? "FAIL", /row-level security/i);
  });

  it("staff cannot read finance; manager can read but not create; admin can create draft invoices", async () => {
    await admin(db, "insert into cos_invoices (organization_id, number, amount, status) values ($1, 'INV-R', 100, 'draft')", [A.org]);
    assert.equal((await peek(db, as.staffA, "select * from cos_invoices")).length, 0);
    assert.equal((await peek(db, as.managerA, "select * from cos_invoices")).length, 1);
    assert.equal((await peek(db, as.adminA, "insert into cos_invoices (organization_id, number, amount) values ($1, 'INV-NEW', 5) returning id", [A.org])).length, 1);
  });

  it("created_by cannot be spoofed", async () => {
    for (const sql of [
      "insert into cos_companies (organization_id, name, created_by) values ($1, 'Spoof', $2)",
      "insert into cos_tasks (organization_id, title, created_by) values ($1, 'Spoof', $2)",
      "insert into cos_invoices (organization_id, number, amount, created_by) values ($1, 'SP-1', 1, $2)",
    ]) {
      assert.match((await denied(db, as.adminA, sql, [A.org, U.founderA])) ?? "FAIL", /row-level security/i, sql);
    }
  });

  it("people: staff see only their own profile; managers see the team; only people.write edits", async () => {
    await admin(db, "insert into cos_workers (organization_id, user_id, display_name) values ($1,$2,'Staff A'), ($1,$3,'Mgr A'), ($1,null,'Contractor')", [A.org, U.staffA, U.managerA]);
    assert.deepEqual((await peek<{ display_name: string }>(db, as.staffA, "select display_name from cos_workers")).map((r) => r.display_name), ["Staff A"]);
    assert.equal((await peek(db, as.managerA, "select * from cos_workers")).length, 3);
    const upd = await peek(db, as.staffA, "update cos_workers set available_hours_week = 99 where user_id = $1 returning id", [U.staffA]);
    assert.equal(upd.length, 0, "staff cannot edit their own capacity record");
    assert.equal((await peek(db, as.managerA, "update cos_workers set available_hours_week = 30 where user_id = $1 returning id", [U.staffA])).length, 1);
    assert.equal((await peek(db, as.adminB, "select * from cos_workers where organization_id = $1", [A.org])).length, 0);
  });

  it("a person's daily closing is visible to them and to people.read; nobody else", async () => {
    const w = await admin<{ id: string }>(db, "select id from cos_workers where user_id = $1", [U.staffA]);
    await run(db, as.staffA, "insert into cos_daily_closings (organization_id, worker_id, completed) values ($1,$2,'done') returning id", [A.org, w[0].id]);
    assert.equal((await peek(db, as.staffA, "select * from cos_daily_closings")).length, 1);
    assert.equal((await peek(db, as.managerA, "select * from cos_daily_closings")).length, 1, "people.read");
    assert.equal((await peek(db, as.clientA, "select * from cos_daily_closings")).length, 0);
    const mgrWorker = (await admin<{ id: string }>(db, "select id from cos_workers where user_id = $1", [U.managerA]))[0].id;
    assert.match((await denied(db, as.staffA, "insert into cos_daily_closings (organization_id, worker_id) values ($1,$2)", [A.org, mgrWorker])) ?? "FAIL", /row-level security/i, "cannot file someone else's closing");
  });

  it("academy: a learner without academy.read still sees their own progress; readers see all", async () => {
    const skill = (await admin<{ id: string }>(db, "insert into academy_skills (organization_id, skill_key, name) values ($1,'design','Design') returning id", [A.org]))[0].id;
    await admin(db, "insert into academy_progress (organization_id, user_id, skill_id) values ($1,$2,$4), ($1,$3,$4)", [A.org, U.clientA, U.managerA, skill]);
    assert.equal((await peek(db, as.clientA, "select * from academy_progress")).length, 1, "client sees only own");
    assert.equal((await peek(db, as.staffA, "select * from academy_progress")).length, 2, "staff hold academy.read");
    assert.equal((await peek(db, as.adminB, "select * from academy_progress")).length, 0);
    assert.match((await denied(db, as.clientA, "insert into academy_progress (organization_id, user_id, skill_id) values ($1,$2,$3)", [A.org, U.viewerA, skill])) ?? "FAIL", /row-level security/i, "learners cannot self-certify or enrol others");
    const own = await peek(db, as.clientA, "update academy_progress set stage='certified', certified_at=now() where user_id=$1 returning id", [U.clientA]);
    assert.equal(own.length, 0, "learners cannot certify themselves");
  });

  it("certified stage requires a certification timestamp (advisory evidence is consistent)", async () => {
    const skill = (await admin<{ id: string }>(db, "select id from academy_skills limit 1"))[0].id;
    const err = await denied(db, as.adminA, "insert into academy_progress (organization_id, user_id, skill_id, stage) values ($1,$2,$3,'certified')", [A.org, U.viewerA, skill]);
    assert.match(err ?? "FAIL", /check constraint/i);
  });
});

describe("work: the graph's task engine under the permission model", () => {
  it("work.write holders create and update tasks in their own tenant only", async () => {
    const t = await run<{ id: string }>(db, as.managerA, "insert into cos_tasks (organization_id, title) values ($1,'Manager task') returning id", [A.org]);
    assert.equal(t.length, 1);
    assert.match((await denied(db, as.managerA, "insert into cos_tasks (organization_id, title) values ($1,'x')", [B.org])) ?? "FAIL", /row-level security/i);
    assert.match((await denied(db, as.staffA, "insert into cos_tasks (organization_id, title) values ($1,'x')", [A.org])) ?? "FAIL", /row-level security/i, "staff hold work.read only");
    assert.match((await denied(db, as.clientA, "insert into cos_tasks (organization_id, title) values ($1,'x')", [A.org])) ?? "FAIL", /row-level security/i);
    const moved = await peek(db, as.managerA, "update cos_tasks set title='renamed' where id=$1 returning id", [t[0].id]);
    assert.equal(moved.length, 1);
    const cross = await peek(db, as.staffB, "update cos_tasks set title='hijack' where id=$1 returning id", [t[0].id]);
    assert.equal(cross.length, 0);
  });

  it("reading tasks needs work.read: staff yes, clients and viewers no", async () => {
    assert.ok((await peek(db, as.staffA, "select * from cos_tasks")).length >= 1);
    assert.equal((await peek(db, as.clientA, "select * from cos_tasks")).length, 0);
  });

  it("assignment decisions are append-only and require work.write", async () => {
    const task = (await admin<{ id: string }>(db, "select id from cos_tasks where organization_id=$1 limit 1", [A.org]))[0].id;
    const staffWorker = (await admin<{ id: string }>(db, "select id from cos_workers where user_id=$1", [U.staffA]))[0].id;
    const ins = "insert into work_assignment_decisions (organization_id, task_id, chosen_worker_id, followed_recommendation, override_reason) values ($1,$2,$3,false,$4) returning id";
    assert.match((await denied(db, as.staffA, ins, [A.org, task, staffWorker, "because"])) ?? "FAIL", /row-level security/i);
    assert.equal((await run(db, as.managerA, ins, [A.org, task, staffWorker, "shadowing"])).length, 1);
    assert.match((await denied(db, as.managerA, "insert into work_assignment_decisions (organization_id, task_id, chosen_worker_id, followed_recommendation) values ($1,$2,$3,false)", [A.org, task, staffWorker])) ?? "FAIL", /check constraint/i, "override needs a reason");
    assert.match((await denied(db, as.managerA, "update work_assignment_decisions set override_reason='edited'")) ?? "FAIL", /permission denied/i, "decisions are immutable");
  });
});

describe("the people doing the work can progress it, but only what is theirs", () => {
  it("an assignee updates their own task but cannot hand it to someone else or touch others' tasks", async () => {
    const [staffW, mgrW] = await Promise.all([
      admin<{ id: string }>(db, "select id from cos_workers where user_id=$1", [U.staffA]).then((r) => r[0].id),
      admin<{ id: string }>(db, "select id from cos_workers where user_id=$1", [U.managerA]).then((r) => r[0].id),
    ]);
    const mine = (await admin<{ id: string }>(db, "insert into cos_tasks (organization_id, title, assignee_worker_id) values ($1,'Staff-owned',$2) returning id", [A.org, staffW]))[0].id;
    const theirs = (await admin<{ id: string }>(db, "insert into cos_tasks (organization_id, title, assignee_worker_id) values ($1,'Manager-owned',$2) returning id", [A.org, mgrW]))[0].id;
    assert.equal((await peek(db, as.staffA, "update cos_tasks set status='in_progress' where id=$1 returning id", [mine])).length, 1);
    assert.equal((await peek(db, as.staffA, "update cos_tasks set status='done' where id=$1 returning id", [theirs])).length, 0, "not their task");
    assert.match((await denied(db, as.staffA, "update cos_tasks set assignee_worker_id=$2 where id=$1", [mine, mgrW])) ?? "FAIL", /row-level security/i, "cannot reassign");
    assert.equal((await peek(db, as.clientA, "update cos_tasks set status='done' where id=$1 returning id", [mine])).length, 0);
    assert.equal((await peek(db, as.staffB, "update cos_tasks set status='done' where id=$1 returning id", [mine])).length, 0, "other tenant");
  });

  it("staff submit their own draft deliverables for review but cannot approve them", async () => {
    const d = (await admin<{ id: string }>(db, "insert into cos_deliverables (organization_id, title) values ($1,'Pack') returning id", [A.org]))[0].id;
    assert.equal((await peek(db, as.staffA, "update cos_deliverables set status='submitted' where id=$1 returning id", [d])).length, 1);
    assert.match((await denied(db, as.staffA, "update cos_deliverables set status='approved' where id=$1", [d])) ?? "FAIL", /row-level security/i, "approval is a manager decision");
    assert.equal((await peek(db, as.clientA, "update cos_deliverables set status='submitted' where id=$1 returning id", [d])).length, 0);
  });
});

describe("Studio asset provenance is a database invariant", () => {
  const base = "insert into creative_assets (organization_id, kind, title, creator_kind, creator_user_id, source_kind, ai_provider, ai_model, license_terms, role, parent_asset_id, channel) values ($1,'image','Hero',$2,$3,$4,$5,$6,$7,$8,$9,$10)";

  it("accepts a clean human original and an AI asset that names provider + model", async () => {
    assert.equal((await peek(db, as.managerA, base + " returning id", [A.org, "human", U.managerA, "original", null, null, null, "working", null, null])).length, 1);
    assert.equal((await peek(db, as.managerA, base + " returning id", [A.org, "ai", null, "ai_generated", "xai", "grok-imagine", "Provider ToS", "working", null, null])).length, 1);
  });

  it("rejects AI assets without provider/model, unlicensed third-party sources, and variants without parent+channel", async () => {
    assert.match((await denied(db, as.managerA, base, [A.org, "ai", null, "ai_generated", null, null, "x", "working", null, null])) ?? "FAIL", /check constraint/i);
    assert.match((await denied(db, as.managerA, base, [A.org, "human", U.managerA, "stock", null, null, null, "working", null, null])) ?? "FAIL", /check constraint/i);
    assert.match((await denied(db, as.managerA, base, [A.org, "human", U.managerA, "original", null, null, null, "variant", null, null])) ?? "FAIL", /check constraint/i);
  });

  it("variants can only point at a parent in the same tenant", async () => {
    const parentB = (await admin<{ id: string }>(db, "insert into creative_assets (organization_id, kind, title, creator_kind, role) values ($1,'image','B master','ai','master') returning id", [B.org]).catch(() => [] as { id: string }[]))[0];
    assert.equal(parentB, undefined, "AI asset without model is rejected even for the service role");
    const pb = (await admin<{ id: string }>(db, "insert into creative_assets (organization_id, kind, title, creator_kind, ai_provider, ai_model, role) values ($1,'image','B master','ai','x','y','master') returning id", [B.org]))[0].id;
    const err = await denied(db, as.managerA, base, [A.org, "human", U.managerA, "original", null, null, null, "variant", pb, "instagram"]);
    assert.match(err ?? "FAIL", /foreign key|violates/i);
  });
});

describe("append-only logs", () => {
  it("ai_runs: members log their own runs, cannot forge another user's, cannot edit", async () => {
    const ins = "insert into ai_runs (organization_id, user_id, provider, model, task_kind, status) values ($1,$2,'xai','grok','reasoning','succeeded') returning id";
    assert.equal((await run(db, as.staffA, ins, [A.org, U.staffA])).length, 1);
    assert.match((await denied(db, as.staffA, ins, [A.org, U.managerA])) ?? "FAIL", /row-level security/i);
    assert.match((await denied(db, as.staffA, "update ai_runs set status='failed'")) ?? "FAIL", /permission denied/i);
    assert.equal((await peek(db, as.staffA, "select * from ai_runs")).length, 1, "staff see only their own runs");
    assert.ok((await peek(db, as.managerA, "select * from ai_runs")).length >= 1, "ai.read holders see all");
    assert.equal((await peek(db, as.adminB, "select * from ai_runs")).length, 0, "other tenant sees none");
  });

  it("comm_activities link only to a single object and need comms.manage to write", async () => {
    const ins = "insert into comm_activities (organization_id, channel, direction, linked_type, linked_id) values ($1,'email','outbound',$2,$3) returning id";
    assert.match((await denied(db, as.staffA, ins, [A.org, "company", coA])) ?? "FAIL", /row-level security/i);
    assert.equal((await peek(db, as.managerA, ins, [A.org, "company", coA])).length, 1);
    assert.match((await denied(db, as.managerA, ins, [A.org, "company", null])) ?? "FAIL", /check constraint/i);
  });
});

describe("the kernel's member-wide policies are gone", () => {
  it("a plain member (viewer) can neither read nor write any Business Graph table", async () => {
    const tables = ["cos_departments", "cos_workers", "cos_capacity_snapshots", "cos_companies", "cos_contacts", "cos_leads", "cos_opportunities", "cos_proposals", "cos_contracts", "cos_projects", "cos_milestones", "cos_tasks", "cos_deliverables", "cos_invoices", "cos_payments", "cos_expenses", "cos_daily_closings", "cos_attention_items", "cos_approval_items"];
    for (const t of tables) {
      assert.equal((await peek(db, as.viewerA, `select * from ${t}`)).length, 0, `${t}: viewer read`);
    }
    assert.match((await denied(db, as.viewerA, "insert into cos_attention_items (organization_id, severity, title) values ($1,'P0','x')", [A.org])) ?? "FAIL", /row-level security/i);
    assert.match((await denied(db, as.viewerA, "insert into cos_expenses (organization_id, amount) values ($1, 1)", [A.org])) ?? "FAIL", /row-level security/i);
  });
});
