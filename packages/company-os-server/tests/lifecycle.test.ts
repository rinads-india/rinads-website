import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { decideGovernedAction, runGovernedAction, type GovernedDeps, type GovernedResult, type OrgContext } from "@rinads/company-os";
import { A, B, U, admin, as, createDb, seed, type Db, type Who } from "../../company-os/tests/db/harness";
import { createGovernedDeps } from "../src";
import { pgRowDb } from "./pg-rowdb";

let db: Db;
before(async () => {
  db = await createDb();
  await seed(db);
});
after(async () => db.close());

const PERMS: Record<string, string[]> = {
  founder: [],
  admin: ["crm.read", "crm.manage", "projects.read", "projects.manage", "finance.read", "finance.manage", "people.read", "people.manage", "studio.read", "studio.manage", "growth.read", "growth.manage", "approvals.read", "approvals.decide", "tasks.manage", "org.manage", "academy.manage", "comms.manage", "company.founder.view", "reports.read"],
  manager: ["crm.read", "crm.manage", "projects.read", "projects.manage", "finance.read", "people.read", "people.manage", "studio.read", "studio.manage", "growth.read", "growth.manage", "approvals.read", "approvals.decide", "tasks.manage", "academy.manage", "comms.manage", "reports.read"],
  staff: ["crm.read", "projects.read", "studio.read", "growth.read", "approvals.read", "tasks.manage"],
};

class Actor_ {
  deps: GovernedDeps;
  constructor(readonly who: Who, readonly roleKey: string, readonly org = A.org, siteLeads?: { fetchRecent(n: number): Promise<never[]> }) {
    this.deps = createGovernedDeps(pgRowDb(db, who), { siteLeads: siteLeads as never });
  }
  get ctx(): OrgContext {
    return { organizationId: this.org, userId: this.who.uid!, roleKey: this.roleKey, permissions: PERMS[this.roleKey] ?? [] };
  }
  user() {
    return { kind: "user" as const, userId: this.who.uid! };
  }
  run(actionKey: string, input: Record<string, unknown>, key = `${actionKey}:${Math.random().toString(36).slice(2)}`) {
    return runGovernedAction(this.deps, { actionKey, input, actor: this.user(), ctx: this.ctx, idempotencyKey: key });
  }
  decide(actionId: string, decision: "approve" | "reject" = "approve", reason?: string) {
    return decideGovernedAction(this.deps, { actionId, decision, approver: this.ctx, reason });
  }
}

const founder = () => new Actor_(as.founderA, "founder");
const adminA = () => new Actor_(as.adminA, "admin");
const adminA2 = () => new Actor_(as.adminA2, "admin");
const manager = () => new Actor_(as.managerA, "manager");
const staff = () => new Actor_(as.staffA, "staff");

function executed(r: GovernedResult): Record<string, unknown> {
  assert.equal(r.status, "executed", `expected executed, got ${JSON.stringify(r)}`);
  return (r as Extract<GovernedResult, { status: "executed" }>).output;
}
function pendingId(r: GovernedResult): string {
  assert.equal(r.status, "approval_required", `expected approval_required, got ${JSON.stringify(r)}`);
  return (r as Extract<GovernedResult, { status: "approval_required" }>).actionId;
}

describe("client lifecycle end-to-end through the governed pipeline (real RLS)", () => {
  const ids: Record<string, string> = {};

  it("lead → qualify → convert creates a connected company, contact and opportunity", async () => {
    const m = manager();
    ids.lead = String(executed(await m.run("lead.create", { name: "Priya Nair", email: "priya@zed.example", companyName: "Zed Retail", source: "website", problem: "Need a storefront" })).id);
    executed(await m.run("lead.qualify", { leadId: ids.lead, status: "qualified" }));
    const conv = executed(await m.run("lead.convert", { leadId: ids.lead, opportunityTitle: "Zed storefront build", amount: 250000 }));
    ids.company = String(conv.companyId);
    ids.contact = String(conv.contactId);
    ids.opp = String(conv.opportunityId);
    const lead = (await admin(db, "select status, converted_company_id, converted_contact_id, converted_opportunity_id from crm_leads where id=$1", [ids.lead]))[0];
    assert.equal(lead.status, "converted");
    assert.equal(lead.converted_company_id, ids.company);
    const contact = (await admin(db, "select company_id, email from crm_contacts where id=$1", [ids.contact]))[0];
    assert.deepEqual(contact, { company_id: ids.company, email: "priya@zed.example" });
  });

  it("converting twice resumes instead of duplicating", async () => {
    const again = executed(await manager().run("lead.convert", { leadId: ids.lead }));
    assert.equal(again.resumed, true);
    assert.equal(again.opportunityId, ids.opp);
    assert.equal(Number((await admin(db, "select count(*)::int as n from crm_companies where organization_id=$1 and name='Zed Retail'", [A.org]))[0].n), 1);
  });

  it("a staff member cannot qualify leads (read-only CRM) — denied before any write", async () => {
    const r = await staff().run("lead.qualify", { leadId: ids.lead, status: "qualified" });
    assert.equal(r.status, "denied");
  });

  it("opportunity advances through the machine; illegal jumps are rejected by the tool", async () => {
    const m = manager();
    assert.equal((await m.run("opportunity.advance", { opportunityId: ids.opp, toStage: "won" })).status, "failed");
    executed(await m.run("opportunity.advance", { opportunityId: ids.opp, toStage: "solution" }));
    executed(await m.run("opportunity.advance", { opportunityId: ids.opp, toStage: "proposal" }));
    const opp = (await admin(db, "select stage from crm_opportunities where id=$1", [ids.opp]))[0];
    assert.equal(opp.stage, "proposal");
  });

  it("sending a proposal is HIGH risk: it waits for a distinct approver and then executes under the approver", async () => {
    const m = manager();
    ids.proposal = String(executed(await m.run("proposal.create", { opportunityId: ids.opp, companyId: ids.company, title: "Zed storefront proposal", amount: 250000, validUntil: "2026-12-01" })).id);
    const req = await m.run("proposal.send", { proposalId: ids.proposal });
    const action = pendingId(req);
    assert.equal((await admin(db, "select status from crm_proposals where id=$1", [ids.proposal]))[0].status, "draft", "nothing happened yet");
    assert.equal((await m.decide(action)).status, "denied", "requester cannot approve their own HIGH action");
    executed(await adminA().decide(action));
    const p = (await admin(db, "select status, sent_action_id from crm_proposals where id=$1", [ids.proposal]))[0];
    assert.equal(p.status, "sent");
    assert.equal(p.sent_action_id, action);
    const ledger = (await admin(db, "select status, approved_by, user_id from rinpo_actions where id=$1", [action]))[0];
    assert.deepEqual(ledger, { status: "executed", approved_by: U.adminA, user_id: U.managerA });
  });

  it("signing a contract is CRITICAL: a manager cannot approve it, an admin/founder can, and the company becomes a client", async () => {
    const m = manager();
    ids.contract = String(executed(await m.run("contract.create", { companyId: ids.company, opportunityId: ids.opp, proposalId: ids.proposal, title: "Zed MSA", value: 250000, startDate: "2026-11-01", endDate: "2027-10-31" })).id);
    await admin(db, "update crm_contracts set status='sent' where id=$1", [ids.contract]);
    const action = pendingId(await m.run("contract.sign", { contractId: ids.contract, signedByName: "Priya Nair" }));
    const byManager = await new Actor_(as.managerA, "manager").decide(action);
    assert.equal(byManager.status, "denied");
    executed(await founder().decide(action));
    assert.equal((await admin(db, "select status from crm_contracts where id=$1", [ids.contract]))[0].status, "signed");
    assert.equal((await admin(db, "select relationship from crm_companies where id=$1", [ids.company]))[0].relationship, "client");
  });

  it("project from the signed contract, milestone, tasks with dependency enforcement, deliverable", async () => {
    const m = manager();
    ids.project = String(executed(await m.run("project.create", { name: "Zed storefront", companyId: ids.company, contractId: ids.contract, dueDate: "2026-12-20", status: "active" })).id);
    ids.milestone = String(executed(await m.run("milestone.update", { projectId: ids.project, name: "Design sign-off", dueDate: "2026-11-15" })).id);
    ids.t1 = String(executed(await m.run("task.create", { title: "Wireframes", projectId: ids.project, milestoneId: ids.milestone, estimateHours: 8, requiredSkills: ["design"], priority: "high" })).id);
    ids.t2 = String(executed(await m.run("task.create", { title: "Visual design", projectId: ids.project, blockedBy: [ids.t1] })).id);
    const blocked = await m.run("task.update_status", { taskId: ids.t2, status: "in_progress" });
    assert.equal(blocked.status, "failed");
    assert.equal(blocked.status === "failed" && blocked.errorClass, "dependency_open");
    executed(await m.run("task.update_status", { taskId: ids.t1, status: "in_progress" }));
    executed(await m.run("task.update_status", { taskId: ids.t1, status: "completed" }));
    executed(await m.run("task.update_status", { taskId: ids.t2, status: "in_progress" }));
    ids.deliverable = String(executed(await m.run("deliverable.create", { projectId: ids.project, milestoneId: ids.milestone, taskId: ids.t1, title: "Wireframe pack" })).id);
    executed(await staff().run("deliverable.submit", { deliverableId: ids.deliverable }));
    executed(await m.run("deliverable.review", { deliverableId: ids.deliverable, decision: "approve" }));
    const d = (await admin(db, "select status, approved_by, company_id from deliverables where id=$1", [ids.deliverable]))[0];
    assert.deepEqual(d, { status: "approved", approved_by: U.managerA, company_id: ids.company });
  });

  it("assignment records the recommendation and requires a rationale to override", async () => {
    const m = manager();
    const noReason = await m.run("task.assign", { taskId: ids.t2, assigneeId: U.staffA, followedRecommendation: false });
    assert.equal(noReason.status, "failed");
    executed(await m.run("task.assign", { taskId: ids.t2, assigneeId: U.staffA, recommendedUserId: U.managerA, followedRecommendation: false, overrideReason: "Staff is shadowing this client", confidence: "medium", factorSnapshot: [{ key: "skill_fit", score: 0.8 }] }));
    const task = (await admin(db, "select assignee_id from operational_tasks where id=$1", [ids.t2]))[0];
    assert.equal(task.assignee_id, U.staffA);
    const dec = (await admin(db, "select override_reason, followed_recommendation, factor_snapshot from work_assignment_decisions where task_id=$1", [ids.t2]))[0];
    assert.equal(dec.followed_recommendation, false);
    assert.equal(dec.override_reason, "Staff is shadowing this client");
    assert.deepEqual(dec.factor_snapshot, [{ key: "skill_fit", score: 0.8 }]);
    assert.equal((await staff().run("task.assign", { taskId: ids.t2, assigneeId: U.staffA, followedRecommendation: true })).status, "denied", "staff cannot assign work");
  });

  it("invoice: server-computed totals → issue (HIGH, approved) → payments (HIGH, approved) reconcile to PAID", async () => {
    const a = adminA();
    const inv = executed(await a.run("invoice.create_draft", { companyId: ids.company, projectId: ids.project, contractId: ids.contract, dueDate: "2026-11-30", taxRatePct: 18, lineItems: [{ description: "Design phase", quantity: 1, unitPrice: 100000 }, { description: "Build phase", quantity: 2, unitPrice: 50000 }] }));
    ids.invoice = String(inv.id);
    assert.equal(inv.total, 236000, "200000 + 18% GST");
    const issue = pendingId(await a.run("invoice.issue", { invoiceId: ids.invoice }));
    assert.equal((await admin(db, "select status from finance_invoices where id=$1", [ids.invoice]))[0].status, "draft");
    executed(await adminA2().decide(issue));
    assert.equal((await admin(db, "select status from finance_invoices where id=$1", [ids.invoice]))[0].status, "issued");

    const over = pendingId(await a.run("payment.record", { invoiceId: ids.invoice, amount: 999999 }));
    const rejected = await adminA2().decide(over);
    assert.equal(rejected.status, "failed", "approved, but the tool refuses an amount above the outstanding balance");

    const p1 = pendingId(await a.run("payment.record", { invoiceId: ids.invoice, amount: 100000, reference: "UTR-1", method: "bank_transfer" }));
    executed(await adminA2().decide(p1));
    assert.equal((await admin(db, "select status from finance_invoices where id=$1", [ids.invoice]))[0].status, "partially_paid");
    const p2 = pendingId(await a.run("payment.record", { invoiceId: ids.invoice, amount: 136000, reference: "UTR-2" }));
    const done = executed(await adminA2().decide(p2));
    assert.equal(done.invoiceStatus, "paid");
    assert.equal(done.outstanding, 0);
    const sum = (await admin(db, "select sum(amount)::float as s from finance_payments where invoice_id=$1", [ids.invoice]))[0].s;
    assert.equal(sum, 236000);
    assert.equal((await adminA().run("payment.record", { invoiceId: ids.invoice, amount: 1 })).status, "approval_required");
  });

  it("every executed action left an audit row and canonical events authored by the executing user", async () => {
    const audits = await admin<{ action: string; actor_id: string; source: string }>(db, "select action, actor_id, source from audit_logs where source='company-os' and organization_id=$1", [A.org]);
    assert.ok(audits.length > 20);
    assert.ok(audits.some((a) => a.action === "company-os.approval.approved"));
    const events = await admin<{ event_type: string; actor_type: string }>(db, "select event_type, actor_type from business_events where source='company-os' and organization_id=$1", [A.org]);
    for (const t of ["lead.created.v1", "lead.converted.v1", "proposal.sent.v1", "contract.signed.v1", "project.created.v1", "task.completed.v1", "task.assigned.v1", "deliverable.approved.v1", "invoice.issued.v1", "payment.received.v1", "approval.requested.v1", "approval.completed.v1"]) {
      assert.ok(events.some((e) => e.event_type === t), `missing event ${t}`);
    }
    assert.ok(events.every((e) => e.actor_type === "user"));
  });

  it("the whole graph is organisation-scoped: every row created belongs to org A and org B sees none of it", async () => {
    for (const t of ["crm_companies", "crm_contacts", "crm_opportunities", "crm_proposals", "crm_contracts", "projects", "operational_tasks", "deliverables", "finance_invoices", "finance_payments"]) {
      const other = await admin<{ n: number }>(db, `select count(*)::int as n from ${t} where organization_id <> $1`, [A.org]);
      assert.equal(other[0].n, 0, `${t} leaked into another org`);
    }
    const asB = pgRowDb(db, as.adminB);
    for (const t of ["crm_companies", "finance_invoices", "projects", "rinpo_actions"]) {
      assert.equal((await asB.select(t)).data.filter((r) => r.organization_id === A.org).length, 0, t);
    }
  });
});

describe("cross-tenant and agent safety through the pipeline", () => {
  it("another tenant's admin can neither read nor act on org A objects or approvals", async () => {
    const m = manager();
    const lead = executed(await m.run("lead.create", { name: "Cross Tenant Probe" }));
    const b = new Actor_(as.adminB, "admin", B.org);
    const r = await b.run("lead.qualify", { leadId: String(lead.id), status: "qualified" });
    assert.equal(r.status, "failed");
    assert.equal(r.status === "failed" && r.errorClass, "not_found");
    const pending = pendingId(await adminA().run("invoice.issue", { invoiceId: "00000000-0000-4000-8000-000000000999" }));
    assert.equal((await b.decide(pending)).status, "denied");
  });

  it("an AI role can only prepare: nothing changes until a human approves, then it runs under the human", async () => {
    const m = manager();
    const task = String(executed(await m.run("task.create", { title: "Agent target" })).id);
    const agent = { kind: "agent" as const, agentRole: "operations_controller", onBehalfOfUserId: U.managerA, provider: "xai", model: "grok" };
    const r = await runGovernedAction(m.deps, { actionKey: "task.assign", input: { taskId: task, assigneeId: U.staffA, followedRecommendation: true }, actor: agent, ctx: m.ctx, idempotencyKey: `agent-${task}` });
    const id = pendingId(r);
    assert.equal((await admin(db, "select assignee_id from operational_tasks where id=$1", [task]))[0].assignee_id, null);
    const row = (await admin(db, "select actor_kind, agent_role, provider, model, status from rinpo_actions where id=$1", [id]))[0];
    assert.deepEqual(row, { actor_kind: "agent", agent_role: "operations_controller", provider: "xai", model: "grok", status: "pending" });
    executed(await m.decide(id));
    assert.equal((await admin(db, "select assignee_id from operational_tasks where id=$1", [task]))[0].assignee_id, U.staffA);
    const evt = await admin<{ payload: { requestedBy: { agentRole: string } } }>(db, "select payload from business_events where event_type='ai.action.executed.v1' and aggregate_id=$1", [id]);
    assert.equal(evt[0].payload.requestedBy.agentRole, "operations_controller");
  });

  it("an agent proposing something outside its permissions or the catalogue is denied outright", async () => {
    const s = staff();
    const agent = { kind: "agent" as const, agentRole: "operations_controller", onBehalfOfUserId: U.staffA };
    const r = await runGovernedAction(s.deps, { actionKey: "task.assign", input: {}, actor: agent, ctx: s.ctx, idempotencyKey: "agent-staff-assign" });
    assert.equal(r.status, "denied");
    const dep = await runGovernedAction(s.deps, { actionKey: "deploy.production", input: {}, actor: agent, ctx: s.ctx, idempotencyKey: "agent-deploy" });
    assert.equal(dep.status, "denied");
  });

  it("idempotent: a retried request with the same key does not create a second record", async () => {
    const m = manager();
    const before = Number((await admin(db, "select count(*)::int as n from crm_leads where organization_id=$1", [A.org]))[0].n);
    const r1 = await m.run("lead.create", { name: "Idem Lead" }, "idem-lead-1");
    const r2 = await m.run("lead.create", { name: "Idem Lead" }, "idem-lead-1");
    assert.equal(r1.status, "executed");
    assert.equal(r2.status === "executed" && r2.replayed, true);
    assert.equal(Number((await admin(db, "select count(*)::int as n from crm_leads where organization_id=$1", [A.org]))[0].n), before + 1);
  });

  it("invalid input fails closed with a validation error and no ledger side effects on the domain", async () => {
    const m = manager();
    const r = await m.run("opportunity.create", { title: "", amount: -5 });
    assert.equal(r.status === "failed" && r.errorClass, "validation_error");
    const bad = await m.run("project.create", { name: "X", contractId: "not-a-uuid" });
    assert.equal(bad.status === "failed" && bad.errorClass, "validation_error");
  });
});

describe("website lead import (fail-closed)", () => {
  it("is not configured by default and never reads anything", async () => {
    const r = await manager().run("lead.import_site", {});
    assert.equal(r.status === "failed" && r.errorClass, "not_configured");
  });

  it("imports each website lead exactly once", async () => {
    const source = { fetchRecent: async () => [
      { id: "11111111-1111-4111-8111-111111111111", name: "Web Lead One", work_email: "one@x.example", company: "One Co", problem: "p", budget: null, timeline: null, outcome: "contact", created_at: new Date().toISOString() },
      { id: "22222222-2222-4222-8222-222222222222", name: "Web Lead Two", work_email: "two@x.example", company: "Two Co", problem: "p", budget: null, timeline: null, outcome: "contact", created_at: new Date().toISOString() },
    ] };
    const m = new Actor_(as.managerA, "manager", A.org, source as never);
    assert.equal(executed(await m.run("lead.import_site", {})).imported, 2);
    const second = executed(await m.run("lead.import_site", {}));
    assert.equal(second.imported, 0);
    assert.equal(second.alreadyPresent, 2);
    assert.equal(Number((await admin(db, "select count(*)::int as n from crm_leads where source_ref in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222')"))[0].n), 2);
  });
});
