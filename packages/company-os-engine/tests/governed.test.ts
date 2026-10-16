import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTION_CATALOG,
  canDecide,
  decideGovernedAction,
  DEFAULT_ACTION_POLICY,
  evaluateAction,
  LedgerConflictError,
  runGovernedAction,
  validateCatalog,
  payloadHash,
  type AuditEntry,
  type BusinessEventInsert,
  type DomainTool,
  type GovernedDeps,
  type LedgerPort,
  type LedgerRecord,
  type NewLedgerRecord,
  type OrgContext,
} from "../src";
import { NOW, ORG, OTHER_ORG } from "./fixtures";

const ctx = (userId: string, roleKey: string, permissions: string[] = []): OrgContext => ({ organizationId: ORG, userId, roleKey, permissions });
const staff = ctx("staff-1", "staff", ["work.write", "clients.read"]);
const manager = ctx("mgr-1", "manager", ["work.write", "people.write", "sales.write", "clients.write", "approvals.decide", "finance.read", "studio.manage", "growth.manage"]);
const finance = ctx("fin-1", "admin", ["finance.write", "sales.write", "clients.write", "approvals.decide"]);
const admin2 = ctx("adm-2", "admin", ["approvals.decide", "sales.write", "clients.write", "finance.write"]);

class MemoryLedger implements LedgerPort {
  rows: LedgerRecord[] = [];
  seq = 0;
  async findByIdempotencyKey(org: string, key: string) {
    return this.rows.find((r) => r.organizationId === org && r.idempotencyKey === key) ?? null;
  }
  async get(org: string, id: string) {
    return this.rows.find((r) => r.organizationId === org && r.id === id) ?? null;
  }
  async insertPending(rec: NewLedgerRecord) {
    if (this.rows.some((r) => r.organizationId === rec.organizationId && r.idempotencyKey === rec.idempotencyKey)) throw new LedgerConflictError();
    const row: LedgerRecord = { ...rec, id: `act-${++this.seq}`, createdAt: NOW.toISOString(), output: null, approvedBy: null, resolvedAt: null, errorClass: null, verification: null };
    this.rows.push(row);
    return row;
  }
  async update(org: string, id: string, patch: Partial<LedgerRecord>) {
    const row = this.rows.find((r) => r.organizationId === org && r.id === id);
    if (!row) throw new Error("not found");
    Object.assign(row, patch);
    return row;
  }
}

function harness(tools: Record<string, DomainTool> = {}, policy = DEFAULT_ACTION_POLICY) {
  const ledger = new MemoryLedger();
  const audits: AuditEntry[] = [];
  const events: BusinessEventInsert[] = [];
  const calls: string[] = [];
  const defaultTool = (key: string, opts: { verify?: boolean; fail?: boolean; throws?: boolean } = {}): DomainTool => ({
    key,
    async execute(c, input) {
      calls.push(`${key}:${c.executorUserId}`);
      if (opts.throws) throw new Error("boom");
      if (opts.fail) return { ok: false, error: "domain rejected", errorClass: "domain_error" };
      return { ok: true, output: { id: "row-1", echo: input } };
    },
    async verify() {
      return opts.verify === false ? { ok: false, error: "row not found after write" } : { ok: true, detail: "row re-read" };
    },
    events: (c) => [{ organization_id: c.organizationId, event_type: "task.created.v1", entity_type: "t", entity_id: "row-1", aggregate_type: "t", aggregate_id: "row-1", payload: {}, metadata: {}, idempotency_key: null, source: "company-os", correlation_id: c.correlationId, causation_id: null, actor_type: "user", actor_id: c.executorUserId }],
  });
  const deps: GovernedDeps = {
    ledger,
    audit: { record: async (e) => void audits.push(e) },
    events: { emit: async (e) => void events.push(e) },
    tools: {
      "task.create": defaultTool("task.create"),
      "invoice.issue": defaultTool("invoice.issue"),
      "payment.record": defaultTool("payment.record"),
      "contract.sign": defaultTool("contract.sign"),
      "task.assign": defaultTool("task.assign"),
      ...tools,
    },
    policy,
    now: () => NOW,
  };
  return { deps, ledger, audits, events, calls };
}

describe("catalogue invariants", () => {
  it("passes its own validation", () => assert.deepEqual(validateCatalog(), []));
  it("no HIGH/CRITICAL action is approval=never", () => {
    for (const a of ACTION_CATALOG) if (a.risk === "HIGH" || a.risk === "CRITICAL") assert.notEqual(a.approval, "never", a.key);
  });
  it("production deploy, secrets, migrations, permission changes and refunds are not executable from the OS", () => {
    for (const key of ["deploy.production", "secrets.rotate", "db.migrate", "permission.change", "refund.process"]) {
      const d = evaluateAction({ actionKey: key, payload: {}, actor: { kind: "user", userId: "f" }, ctx: ctx("f", "founder") });
      assert.equal(d.decision, "DENY", key);
      assert.equal(d.decision === "DENY" && d.errorClass, "not_executable");
    }
  });
});

describe("policy engine", () => {
  it("denies unknown actions and missing tenant context", () => {
    assert.equal(evaluateAction({ actionKey: "nope", payload: {}, actor: { kind: "user", userId: "u" }, ctx: staff }).decision, "DENY");
    assert.equal(evaluateAction({ actionKey: "task.create", payload: {}, actor: { kind: "user", userId: "u" }, ctx: { ...staff, organizationId: "" } }).decision, "DENY");
  });

  it("denies when the human lacks the permission", () => {
    const d = evaluateAction({ actionKey: "task.assign", payload: {}, actor: { kind: "user", userId: "s" }, ctx: staff });
    assert.equal(d.decision, "DENY");
    assert.equal(d.decision === "DENY" && d.errorClass, "authorization_error");
  });

  it("allows LOW risk with permission; HIGH/CRITICAL always require approval even for admins and founders", () => {
    assert.equal(evaluateAction({ actionKey: "task.create", payload: {}, actor: { kind: "user", userId: "s" }, ctx: staff }).decision, "ALLOW");
    for (const [key, role, perms] of [
      ["invoice.issue", "admin", ["finance.write"]],
      ["payment.record", "founder", []],
      ["contract.sign", "founder", []],
    ] as const) {
      const d = evaluateAction({ actionKey: key, payload: { amount: 1 }, actor: { kind: "user", userId: "x" }, ctx: ctx("x", role, [...perms]) });
      assert.equal(d.decision, "APPROVAL_REQUIRED", key);
    }
    // an admin WITHOUT the permission is denied — role name alone is not enough (only founder/super_admin are privileged)
    assert.equal(evaluateAction({ actionKey: "invoice.issue", payload: {}, actor: { kind: "user", userId: "x" }, ctx: ctx("x", "admin", []) }).decision, "DENY");
  });

  it("agents can only PROPOSE: even LOW-risk agent actions require approval, and are bounded by the human's permissions", () => {
    const agent = { kind: "agent" as const, agentRole: "operations_controller", onBehalfOfUserId: "staff-1", provider: "xai", model: "grok" };
    const low = evaluateAction({ actionKey: "task.create", payload: {}, actor: agent, ctx: staff });
    assert.equal(low.decision, "APPROVAL_REQUIRED");
    // agent acting for someone without the permission is denied outright
    const denied = evaluateAction({ actionKey: "task.assign", payload: {}, actor: agent, ctx: staff });
    assert.equal(denied.decision, "DENY");
    // agents cannot prepare things the catalogue forbids them
    const forbidden = evaluateAction({ actionKey: "invoice.void", payload: {}, actor: agent, ctx: finance });
    assert.equal(forbidden.decision, "DENY");
    assert.equal(forbidden.decision === "DENY" && forbidden.errorClass, "agent_not_permitted");
  });

  it("escalates payments at/above the critical threshold and ads budget jumps", () => {
    const policy = { ...DEFAULT_ACTION_POLICY, criticalPaymentAmount: 100000 };
    const big = evaluateAction({ actionKey: "payment.record", payload: { amount: 250000 }, actor: { kind: "user", userId: "f" }, ctx: finance, policy });
    assert.equal(big.decision === "APPROVAL_REQUIRED" && big.risk, "CRITICAL");
    const small = evaluateAction({ actionKey: "payment.record", payload: { amount: 5000 }, actor: { kind: "user", userId: "f" }, ctx: finance, policy });
    assert.equal(small.decision === "APPROVAL_REQUIRED" && small.risk, "HIGH");
    const ads = evaluateAction({ actionKey: "ads.budget_change", payload: { currentBudget: 100, proposedBudget: 100000 }, actor: { kind: "user", userId: "m" }, ctx: manager, policy: { ...policy, budget: { maxAutoChangePct: 20, highBudgetThreshold: 5000 } } });
    assert.equal(ads.decision === "APPROVAL_REQUIRED" && ads.risk, "CRITICAL");
  });

  it("approver rules: permission, distinct approver, admin-or-founder for CRITICAL", () => {
    const base = { requesterKind: "user" as const, onBehalfOfUserId: null, approverPermission: "approvals.decide" };
    assert.equal(canDecide({ ...base, approver: staff, requesterUserId: "x", risk: "HIGH", distinctApprover: true }).ok, false, "no approvals.decide");
    assert.equal(canDecide({ ...base, approver: finance, requesterUserId: "fin-1", risk: "HIGH", distinctApprover: true }).ok, false, "self-approval blocked");
    assert.equal(canDecide({ ...base, approver: finance, requesterUserId: "fin-1", risk: "HIGH", distinctApprover: false }).ok, true, "solo operator may relax HIGH");
    assert.equal(canDecide({ ...base, approver: manager, requesterUserId: "x", risk: "CRITICAL", distinctApprover: true }).ok, false, "manager cannot approve CRITICAL");
    assert.equal(canDecide({ ...base, approver: admin2, requesterUserId: "x", risk: "CRITICAL", distinctApprover: true }).ok, true);
  });
});

describe("governed pipeline", () => {
  it("LOW risk: executes, verifies, audits, emits, records ledger — and replays idempotently", async () => {
    const h = harness();
    const req = { actionKey: "task.create", input: { title: "t" }, actor: { kind: "user" as const, userId: "staff-1" }, ctx: staff, idempotencyKey: "k1", correlationId: "corr" };
    const r1 = await runGovernedAction(h.deps, req);
    assert.equal(r1.status, "executed");
    assert.equal(h.ledger.rows[0].status, "executed");
    assert.equal(h.ledger.rows[0].verification?.ok, true);
    assert.equal(h.audits.at(-1)?.action, "company-os.action.executed");
    assert.equal(h.events.length, 1);
    const r2 = await runGovernedAction(h.deps, req);
    assert.equal(r2.status, "executed");
    assert.equal(r2.status === "executed" && r2.replayed, true);
    assert.equal(h.calls.length, 1, "tool ran exactly once");
    assert.equal(h.ledger.rows.length, 1);
  });

  it("denied requests never touch the tool or create a ledger row, but are audited", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "task.assign", input: {}, actor: { kind: "user", userId: "staff-1" }, ctx: staff, idempotencyKey: "k2" });
    assert.equal(r.status, "denied");
    assert.equal(h.calls.length, 0);
    assert.equal(h.ledger.rows.length, 0);
    assert.equal(h.audits[0].action, "company-os.action.denied");
  });

  it("HIGH risk: parks as pending with a payload hash and expiry; nothing executes until approved", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "invoice.issue", input: { invoiceId: "i1" }, actor: { kind: "user", userId: "fin-1" }, ctx: finance, idempotencyKey: "k3" });
    assert.equal(r.status, "approval_required");
    assert.equal(h.calls.length, 0);
    const row = h.ledger.rows[0];
    assert.equal(row.status, "pending");
    assert.equal(row.payloadHash, payloadHash("invoice.issue", { invoiceId: "i1" }));
    assert.ok(row.expiresAt && row.expiresAt > NOW.toISOString());
    assert.equal(row.distinctApprover, true);
    assert.equal(h.events[0].event_type, "approval.requested.v1");
  });

  it("approval by a distinct approver executes under the APPROVER's identity and records both", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "invoice.issue", input: { invoiceId: "i1" }, actor: { kind: "user", userId: "fin-1" }, ctx: finance, idempotencyKey: "k4" });
    assert.equal(r.status, "approval_required");
    const id = r.status === "approval_required" ? r.actionId : "";
    const done = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: admin2 });
    assert.equal(done.status, "executed");
    assert.deepEqual(h.calls, ["invoice.issue:adm-2"]);
    const row = h.ledger.rows[0];
    assert.equal(row.status, "executed");
    assert.equal(row.approvedBy, "adm-2");
    assert.equal(row.requestedByUserId, "fin-1");
    assert.ok(h.audits.some((a) => a.action === "company-os.approval.approved" && a.approvedBy === "adm-2"));
    assert.ok(h.events.some((e) => e.event_type === "approval.completed.v1"));
  });

  it("blocks self-approval, wrong tenant, double decision and unknown ids", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "invoice.issue", input: {}, actor: { kind: "user", userId: "fin-1" }, ctx: finance, idempotencyKey: "k5" });
    const id = r.status === "approval_required" ? r.actionId : "";
    const self = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: finance });
    assert.equal(self.status, "denied");
    assert.equal(h.calls.length, 0);
    const foreign = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: { ...admin2, organizationId: OTHER_ORG } });
    assert.equal(foreign.status, "denied");
    assert.equal(foreign.status === "denied" && foreign.errorClass, "not_found", "cross-tenant approval impossible");
    assert.equal((await decideGovernedAction(h.deps, { actionId: "missing", decision: "approve", approver: admin2 })).status, "denied");
    await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: admin2 });
    const again = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: admin2 });
    assert.equal(again.status === "denied" && again.errorClass, "invalid_state");
    assert.equal(h.calls.length, 1);
  });

  it("detects a tampered payload after approval was requested", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "payment.record", input: { amount: 100, invoiceId: "i" }, actor: { kind: "user", userId: "fin-1" }, ctx: finance, idempotencyKey: "k6" });
    const id = r.status === "approval_required" ? r.actionId : "";
    h.ledger.rows[0].input = { amount: 9999999, invoiceId: "i" };
    const d = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: admin2 });
    assert.equal(d.status === "denied" && d.errorClass, "payload_tampered");
    assert.equal(h.calls.length, 0);
    assert.ok(h.audits.some((a) => a.action === "company-os.approval.tamper_detected"));
  });

  it("expired approvals cannot be approved", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "invoice.issue", input: {}, actor: { kind: "user", userId: "fin-1" }, ctx: finance, idempotencyKey: "k7" });
    const id = r.status === "approval_required" ? r.actionId : "";
    h.ledger.rows[0].expiresAt = new Date(NOW.getTime() - 1000).toISOString();
    const d = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: admin2 });
    assert.equal(d.status === "denied" && d.errorClass, "expired");
    assert.equal(h.ledger.rows[0].status, "expired");
    assert.equal(h.calls.length, 0);
  });

  it("rejecting records the decision and never runs the tool", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "invoice.issue", input: {}, actor: { kind: "user", userId: "fin-1" }, ctx: finance, idempotencyKey: "k8" });
    const id = r.status === "approval_required" ? r.actionId : "";
    const d = await decideGovernedAction(h.deps, { actionId: id, decision: "reject", approver: admin2, reason: "wrong client" });
    assert.equal(d.status, "rejected");
    assert.equal(h.ledger.rows[0].status, "rejected");
    assert.equal(h.ledger.rows[0].reason, "wrong client");
    assert.equal(h.calls.length, 0);
  });

  it("AI proposals require approval, run under the approver, and emit ai.action.* events", async () => {
    const h = harness();
    const agent = { kind: "agent" as const, agentRole: "operations_controller", onBehalfOfUserId: "mgr-1", provider: "anthropic", model: "claude" };
    const r = await runGovernedAction(h.deps, { actionKey: "task.assign", input: { taskId: "t", userId: "u" }, actor: agent, ctx: manager, idempotencyKey: "k9" });
    assert.equal(r.status, "approval_required");
    assert.equal(h.calls.length, 0, "model output alone never mutates anything");
    const row = h.ledger.rows[0];
    assert.equal(row.requestedByKind, "agent");
    assert.equal(row.agentRole, "operations_controller");
    assert.equal(row.provider, "anthropic");
    const done = await decideGovernedAction(h.deps, { actionId: row.id, decision: "approve", approver: manager });
    assert.equal(done.status, "executed", "human who requested the agent may approve its proposal");
    const executed = h.events.find((e) => e.event_type === "ai.action.executed.v1");
    assert.ok(executed, "ai.action.executed emitted");
    assert.equal(executed!.actor_type, "user", "authored by the executing session user (what the database accepts)");
    assert.equal(executed!.actor_id, "mgr-1");
    assert.deepEqual((executed!.payload.requestedBy as { kind: string; agentRole: string }).agentRole, "operations_controller", "the AI requester is preserved in the payload");
    assert.equal(h.audits.at(-1)?.actor.kind, "user");
  });

  it("an approver without approvals.decide cannot approve an agent proposal", async () => {
    const h = harness();
    const mgrWithoutDecide = ctx("mgr-2", "manager", ["work.write", "work.write"]);
    const agent = { kind: "agent" as const, agentRole: "operations_controller", onBehalfOfUserId: "mgr-2" };
    const r = await runGovernedAction(h.deps, { actionKey: "task.assign", input: {}, actor: agent, ctx: mgrWithoutDecide, idempotencyKey: "k10" });
    const id = r.status === "approval_required" ? r.actionId : "";
    const d = await decideGovernedAction(h.deps, { actionId: id, decision: "approve", approver: mgrWithoutDecide });
    assert.equal(d.status, "denied");
    assert.equal(h.calls.length, 0);
  });

  it("postcondition verification failure marks the action failed+uncertain even if the tool said ok", async () => {
    const h = harness({ "task.create": { key: "task.create", execute: async () => ({ ok: true, output: { id: "x" } }), verify: async () => ({ ok: false, error: "row missing" }) } });
    const r = await runGovernedAction(h.deps, { actionKey: "task.create", input: {}, actor: { kind: "user", userId: "staff-1" }, ctx: staff, idempotencyKey: "k11" });
    assert.equal(r.status, "failed");
    assert.equal(r.status === "failed" && r.errorClass, "verification_error");
    assert.equal(r.status === "failed" && r.uncertain, true);
    assert.equal(h.ledger.rows[0].status, "failed");
    assert.equal(h.events.filter((e) => e.event_type === "task.created.v1").length, 0, "no domain event for an unverified write");
  });

  it("tool failure and tool exceptions are recorded; a retry with the same key does NOT re-run (fresh key required)", async () => {
    const h = harness({ "task.create": { key: "task.create", execute: async () => ({ ok: false, error: "nope", errorClass: "domain_error" }), verify: async () => ({ ok: true }) } });
    const req = { actionKey: "task.create", input: {}, actor: { kind: "user" as const, userId: "staff-1" }, ctx: staff, idempotencyKey: "k12" };
    const r = await runGovernedAction(h.deps, req);
    assert.equal(r.status === "failed" && r.errorClass, "domain_error");
    const again = await runGovernedAction(h.deps, req);
    assert.equal(again.status, "failed");
    assert.equal(h.ledger.rows.length, 1);

    const t = harness({ "task.create": { key: "task.create", execute: async () => { throw new Error("db down"); }, verify: async () => ({ ok: true }) } });
    const r2 = await runGovernedAction(t.deps, { ...req, idempotencyKey: "k13" });
    assert.equal(r2.status === "failed" && r2.uncertain, true, "an exception mid-write is uncertain");
  });

  it("missing tool fails closed", async () => {
    const h = harness();
    const r = await runGovernedAction(h.deps, { actionKey: "lead.create", input: {}, actor: { kind: "user", userId: "mgr-1" }, ctx: manager, idempotencyKey: "k14" });
    assert.equal(r.status === "failed" && r.errorClass, "tool_missing");
  });

  it("concurrent identical requests resolve to one ledger row (conflict → replay)", async () => {
    const h = harness();
    const req = { actionKey: "invoice.issue", input: { invoiceId: "i" }, actor: { kind: "user" as const, userId: "fin-1" }, ctx: finance, idempotencyKey: "race" };
    const [a, b] = await Promise.all([runGovernedAction(h.deps, req), runGovernedAction(h.deps, req)]);
    assert.equal(h.ledger.rows.length, 1);
    assert.equal(a.status, "approval_required");
    assert.equal(b.status, "approval_required");
  });

  it("idempotency is per-organisation", async () => {
    const h = harness();
    await runGovernedAction(h.deps, { actionKey: "task.create", input: {}, actor: { kind: "user", userId: "s" }, ctx: staff, idempotencyKey: "same" });
    const other = { ...staff, organizationId: OTHER_ORG };
    const r = await runGovernedAction(h.deps, { actionKey: "task.create", input: {}, actor: { kind: "user", userId: "s" }, ctx: other, idempotencyKey: "same" });
    assert.equal(r.status === "executed" && r.replayed, false);
    assert.equal(h.ledger.rows.length, 2);
  });

  it("audit failures never mask the action result", async () => {
    const h = harness();
    h.deps.audit.record = async () => { throw new Error("audit down"); };
    const r = await runGovernedAction(h.deps, { actionKey: "task.create", input: {}, actor: { kind: "user", userId: "s" }, ctx: staff, idempotencyKey: "a1" });
    assert.equal(r.status, "executed");
  });
});
