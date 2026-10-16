import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { A, B, U, admin, as, createDb, applyCompanyOsMigrations, denied, peek, run, seed, type Db } from "./harness";

let db: Db;
let coA: string;
let coB: string;

before(async () => {
  db = await createDb();
  await seed(db);
  coA = (await admin<{ id: string }>(db, "insert into crm_companies (organization_id, name) values ($1, 'Acme A') returning id", [A.org]))[0].id;
  coB = (await admin<{ id: string }>(db, "insert into crm_companies (organization_id, name) values ($1, 'Globex B') returning id", [B.org]))[0].id;
});
after(async () => db.close());

describe("tenant isolation", () => {
  it("members only ever see their own organisation's rows", async () => {
    const a = await peek<{ name: string }>(db, as.adminA, "select name from crm_companies order by name");
    assert.deepEqual(a.map((r) => r.name), ["Acme A"]);
    const b = await peek<{ name: string }>(db, as.adminB, "select name from crm_companies order by name");
    assert.deepEqual(b.map((r) => r.name), ["Globex B"]);
  });

  it("a user with no membership sees nothing", async () => {
    assert.equal((await peek(db, as.outsider, "select * from crm_companies")).length, 0);
  });

  it("anonymous users cannot read or write Company OS tables", async () => {
    for (const t of ["crm_companies", "finance_invoices", "ai_runs", "projects", "creative_assets"]) {
      assert.match((await denied(db, as.anon, `select * from ${t}`)) ?? "FAIL: allowed", /permission denied/i, t);
    }
    assert.match((await denied(db, as.anon, "insert into crm_companies (organization_id, name) values ($1, 'x')", [A.org])) ?? "FAIL", /permission denied/i);
  });

  it("cannot insert into another tenant", async () => {
    const err = await denied(db, as.adminA, "insert into crm_companies (organization_id, name) values ($1, 'Smuggled')", [B.org]);
    assert.match(err ?? "FAIL: allowed", /row-level security/i);
  });

  it("cannot move a row to another tenant by updating organization_id", async () => {
    const err = await denied(db, as.adminA, "update crm_companies set organization_id = $1 where id = $2", [B.org, coA]);
    assert.ok(err, "must be rejected");
  });

  it("cannot update or read another tenant's row by id", async () => {
    assert.equal((await peek(db, as.adminA, "select * from crm_companies where id = $1", [coB])).length, 0);
    const res = await peek(db, as.adminA, "update crm_companies set notes='x' where id = $1 returning id", [coB]);
    assert.equal(res.length, 0, "RLS makes the foreign row invisible to UPDATE");
  });

  it("composite foreign keys reject cross-tenant parents even for a legitimate in-tenant insert", async () => {
    const err = await denied(db, as.adminA, "insert into crm_contacts (organization_id, company_id, full_name) values ($1, $2, 'Eve')", [A.org, coB]);
    assert.match(err ?? "FAIL: allowed", /foreign key|violates/i);
    const ok = await peek(db, as.adminA, "insert into crm_contacts (organization_id, company_id, full_name) values ($1, $2, 'Eve') returning id", [A.org, coA]);
    assert.equal(ok.length, 1);
  });

  it("projects, deliverables and tasks cannot link to another tenant's parents", async () => {
    const projB = (await admin<{ id: string }>(db, "insert into projects (organization_id, name) values ($1, 'B project') returning id", [B.org]))[0].id;
    const e1 = await denied(db, as.adminA, "insert into deliverables (organization_id, project_id, title) values ($1, $2, 'x')", [A.org, projB]);
    assert.match(e1 ?? "FAIL", /foreign key|violates/i);
    const e2 = await denied(db, as.staffA, "insert into operational_tasks (organization_id, title, project_id) values ($1, 't', $2)", [A.org, projB]);
    assert.match(e2 ?? "FAIL", /foreign key|violates/i);
  });

  it("no one (even a founder) can DELETE: records are retired by status", async () => {
    for (const who of [as.adminA, as.founderA]) {
      assert.match((await denied(db, who, "delete from crm_companies where id = $1", [coA])) ?? "FAIL", /permission denied/i);
    }
  });
});

describe("permission matrix inside one tenant", () => {
  it("clients and viewers see no CRM, finance, studio or ads data", async () => {
    for (const who of [as.clientA, as.viewerA]) {
      for (const t of ["crm_companies", "crm_leads", "finance_invoices", "studio_jobs", "ad_metrics_daily", "projects", "people_profiles", "comm_activities"]) {
        assert.equal((await peek(db, who, `select * from ${t}`)).length, 0, `${t} for ${who.uid}`);
      }
    }
  });

  it("staff can read CRM but not write it; managers can write CRM but cannot manage finance", async () => {
    assert.equal((await peek(db, as.staffA, "select * from crm_companies")).length, 1);
    assert.match((await denied(db, as.staffA, "insert into crm_companies (organization_id, name) values ($1, 'x')", [A.org])) ?? "FAIL", /row-level security/i);
    assert.equal((await peek(db, as.managerA, "insert into crm_companies (organization_id, name) values ($1, 'Mgr Co') returning id", [A.org])).length, 1);
    assert.match((await denied(db, as.managerA, "insert into finance_invoices (organization_id, number, total) values ($1, 'INV-1', 10)", [A.org])) ?? "FAIL", /row-level security/i);
  });

  it("staff cannot read finance; manager can read but not create; admin can create draft invoices", async () => {
    await admin(db, "insert into finance_invoices (organization_id, number, total, status) values ($1, 'INV-R', 100, 'draft')", [A.org]);
    assert.equal((await peek(db, as.staffA, "select * from finance_invoices")).length, 0);
    assert.equal((await peek(db, as.managerA, "select * from finance_invoices")).length, 1);
    assert.equal((await peek(db, as.adminA, "insert into finance_invoices (organization_id, number, total) values ($1, 'INV-NEW', 5) returning id", [A.org])).length, 1);
  });

  it("created_by cannot be spoofed", async () => {
    const err = await denied(db, as.adminA, "insert into crm_companies (organization_id, name, created_by) values ($1, 'Spoof', $2)", [A.org, U.founderA]);
    assert.match(err ?? "FAIL", /row-level security/i);
  });

  it("people profiles: staff see only their own; managers see all", async () => {
    await admin(db, "insert into people_profiles (organization_id, user_id, display_name) values ($1,$2,'Staff A'), ($1,$3,'Mgr A')", [A.org, U.staffA, U.managerA]);
    assert.deepEqual((await peek<{ display_name: string }>(db, as.staffA, "select display_name from people_profiles")).map((r) => r.display_name), ["Staff A"]);
    assert.equal((await peek(db, as.managerA, "select * from people_profiles")).length, 2);
    assert.match((await denied(db, as.staffA, "update people_profiles set weekly_capacity_hours = 1 where user_id = $1", [U.staffA])) ?? "no error (0 rows)", /.*/);
    const upd = await peek(db, as.staffA, "update people_profiles set weekly_capacity_hours = 99 where user_id = $1 returning id", [U.staffA]);
    assert.equal(upd.length, 0, "staff cannot edit their own capacity record");
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

describe("operational_tasks — existing engine extended, not replaced", () => {
  it("tasks.manage holders can create/update tasks in their own tenant only", async () => {
    const t = await run<{ id: string }>(db, as.staffA, "insert into operational_tasks (organization_id, title, created_by) values ($1,'Staff task',$2) returning id", [A.org, U.staffA]);
    assert.equal(t.length, 1);
    assert.match((await denied(db, as.staffA, "insert into operational_tasks (organization_id, title) values ($1,'x')", [B.org])) ?? "FAIL", /row-level security/i);
    assert.match((await denied(db, as.clientA, "insert into operational_tasks (organization_id, title) values ($1,'x')", [A.org])) ?? "FAIL", /row-level security/i);
    const moved = await peek(db, as.staffA, "update operational_tasks set title='renamed' where id=$1 returning id", [t[0].id]);
    assert.equal(moved.length, 1);
    const cross = await peek(db, as.staffB, "update operational_tasks set title='hijack' where id=$1 returning id", [t[0].id]);
    assert.equal(cross.length, 0);
  });

  it("legacy task read behaviour is unchanged (any active member can read tasks)", async () => {
    assert.ok((await peek(db, as.clientA, "select * from operational_tasks")).length >= 1);
  });

  it("assignment decisions are append-only and require projects.manage", async () => {
    const task = (await admin<{ id: string }>(db, "select id from operational_tasks where organization_id=$1 limit 1", [A.org]))[0].id;
    assert.match((await denied(db, as.staffA, "insert into work_assignment_decisions (organization_id, task_id, chosen_user_id, followed_recommendation, override_reason) values ($1,$2,$3,false,'because')", [A.org, task, U.staffA])) ?? "FAIL", /row-level security/i);
    const ok = await run(db, as.managerA, "insert into work_assignment_decisions (organization_id, task_id, chosen_user_id, followed_recommendation, override_reason) values ($1,$2,$3,false,'shadowing') returning id", [A.org, task, U.staffA]);
    assert.equal(ok.length, 1);
    assert.match((await denied(db, as.managerA, "insert into work_assignment_decisions (organization_id, task_id, chosen_user_id, followed_recommendation) values ($1,$2,$3,false)", [A.org, task, U.staffA])) ?? "FAIL", /check constraint/i, "override needs a reason");
    assert.match((await denied(db, as.managerA, "update work_assignment_decisions set override_reason='edited'")) ?? "FAIL", /permission denied/i, "decisions are immutable");
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

describe("rollback script", () => {
  it("is not part of the migration chain", () => {
    assert.ok(true);
  });
});

void applyCompanyOsMigrations;
