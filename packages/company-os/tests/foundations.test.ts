import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTION_CATALOG,
  COMPANY_OS_PERMISSIONS,
  OS_AREAS,
  ROLE_PERMISSION_GRANTS,
  can,
  groupAreas,
  payloadHash,
  resolveAreaFromPath,
  sha256Hex,
  stableStringify,
  visibleAreas,
  buildBusinessEvent,
  COMPANY_OS_EVENT_TYPES,
  assertTransition,
  canTransition,
  CONTRACT_MACHINE,
  DELIVERABLE_MACHINE,
  INVOICE_MACHINE,
  LEAD_MACHINE,
  OPPORTUNITY_MACHINE,
  PROJECT_MACHINE,
  TASK_MACHINE,
  isClient,
  LIFECYCLE_STAGES,
  type StateMachine,
} from "../src";

describe("sha256 / stable hashing", () => {
  it("matches published SHA-256 vectors", () => {
    assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert.equal(
      sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
    );
  });

  it("handles multi-byte input and length boundaries", () => {
    assert.equal(sha256Hex("a".repeat(55)).length, 64);
    assert.equal(sha256Hex("a".repeat(56)).length, 64);
    assert.equal(sha256Hex("a".repeat(64)).length, 64);
    assert.notEqual(sha256Hex("₹100"), sha256Hex("Rs100"));
    // known vector for 1,000 'a'
    assert.equal(sha256Hex("a".repeat(1000)), "41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
  });

  it("stableStringify ignores key order and undefined members", () => {
    assert.equal(stableStringify({ b: 1, a: { d: 2, c: undefined, e: [3, { z: 1, y: 2 }] } }), stableStringify({ a: { e: [3, { y: 2, z: 1 }], d: 2 }, b: 1 }));
  });

  it("payloadHash binds action key and payload", () => {
    assert.equal(payloadHash("a", { x: 1, y: 2 }), payloadHash("a", { y: 2, x: 1 }));
    assert.notEqual(payloadHash("a", { x: 1 }), payloadHash("b", { x: 1 }));
    assert.notEqual(payloadHash("a", { x: 1 }), payloadHash("a", { x: 2 }));
  });
});

describe("permissions", () => {
  it("every role grant is a known permission", () => {
    for (const [role, grants] of Object.entries(ROLE_PERMISSION_GRANTS)) {
      for (const g of grants) assert.ok((COMPANY_OS_PERMISSIONS as readonly string[]).includes(g), `${role}:${g}`);
    }
  });

  it("founder/super_admin pass every permission; others only what they hold", () => {
    assert.equal(can({ roleKey: "founder", permissions: [] }, "finance.manage"), true);
    assert.equal(can({ roleKey: "super_admin", permissions: [] }, "ai.manage"), true);
    assert.equal(can({ roleKey: "staff", permissions: ["crm.read"] }, "crm.read"), true);
    assert.equal(can({ roleKey: "staff", permissions: ["crm.read"] }, "crm.manage"), false);
    assert.equal(can({ roleKey: null, permissions: [] }, "crm.read"), false);
  });

  it("clients and viewers get no Company OS permissions; managers cannot see the founder tower or manage finance", () => {
    assert.deepEqual(ROLE_PERMISSION_GRANTS.client, []);
    assert.deepEqual(ROLE_PERMISSION_GRANTS.viewer, []);
    assert.ok(!ROLE_PERMISSION_GRANTS.manager.includes("company.founder.view"));
    assert.ok(!ROLE_PERMISSION_GRANTS.manager.includes("finance.manage"));
    assert.ok(ROLE_PERMISSION_GRANTS.admin.includes("company.founder.view"));
    assert.ok(!ROLE_PERMISSION_GRANTS.staff.includes("approvals.decide"));
  });
});

describe("area registry", () => {
  const required = ["home", "founder", "customers", "sales", "work", "studio", "growth", "ads", "engineering", "ai", "commerce", "finance", "people", "logistics", "communication", "academy", "platforms", "assets", "approvals", "reports", "settings"];

  it("contains exactly the 21 required areas, unique ids and hrefs inside /os", () => {
    assert.deepEqual(OS_AREAS.map((a) => a.id).sort(), [...required].sort());
    assert.equal(new Set(OS_AREAS.map((a) => a.href)).size, OS_AREAS.length);
    for (const a of OS_AREAS) assert.ok(a.href === "/os" || a.href.startsWith("/os/"), a.id);
    assert.ok(!OS_AREAS.some((a) => a.label.toLowerCase() === "dashboard"));
  });

  it("is role-aware: clients see only member-level areas, admins see all", () => {
    const client = visibleAreas({ roleKey: "client", permissions: [] }).map((a) => a.id);
    assert.deepEqual(client.sort(), ["customers", "growth", "home", "work"].sort());
    assert.equal(visibleAreas({ roleKey: "admin", permissions: [...ROLE_PERMISSION_GRANTS.admin, "org.manage", "org.read", "commerce.order.read"] }).length, 21);
    assert.equal(visibleAreas(null).length, client.length);
  });

  it("groups areas without losing any", () => {
    const groups = groupAreas(OS_AREAS);
    assert.equal(groups.flatMap((g) => g.areas).length, 21);
  });

  it("resolves areas from nested and legacy paths", () => {
    assert.equal(resolveAreaFromPath("/os"), "home");
    assert.equal(resolveAreaFromPath("/os/"), "home");
    assert.equal(resolveAreaFromPath("/os/customers/abc"), "customers");
    assert.equal(resolveAreaFromPath("/os/work/projects"), "work");
    assert.equal(resolveAreaFromPath("/os/money"), "finance");
    assert.equal(resolveAreaFromPath("/os/automate"), "settings");
    assert.equal(resolveAreaFromPath("/os/rooms"), "communication");
    assert.equal(resolveAreaFromPath("/os/nope"), null);
    assert.equal(resolveAreaFromPath("/os/assets"), "assets");
  });
});

describe("events", () => {
  it("builds tenant-scoped, correlated, idempotent event rows", () => {
    const e = buildBusinessEvent({
      organizationId: "org-1",
      type: "invoice.issued.v1",
      aggregateType: "finance_invoice",
      aggregateId: "inv-1",
      payload: { total: 100 },
      actor: { kind: "user", userId: "u1" },
      correlationId: "corr-1",
      idempotencyKey: "invoice.issued:inv-1",
    });
    assert.equal(e.organization_id, "org-1");
    assert.equal(e.source, "company-os");
    assert.equal(e.actor_type, "user");
    assert.equal(e.actor_id, "u1");
    assert.equal(e.correlation_id, "corr-1");
    assert.equal(e.idempotency_key, "invoice.issued:inv-1");
  });

  it("records agent provenance without making the agent a user", () => {
    const e = buildBusinessEvent({
      organizationId: "o",
      type: "ai.action.executed.v1",
      aggregateType: "x",
      aggregateId: "1",
      actor: { kind: "agent", agentRole: "ads_manager", onBehalfOfUserId: "u9", provider: "xai", model: "grok" },
    });
    assert.equal(e.actor_type, "ai");
    assert.equal(e.actor_id, "ads_manager");
    assert.equal(e.metadata.onBehalfOf, "u9");
  });

  it("covers the canonical vocabulary from the build contract", () => {
    for (const t of ["lead.created", "proposal.sent", "contract.signed", "task.completed", "milestone.delayed", "creative.submitted", "creative.approved", "content.published", "invoice.issued", "invoice.overdue", "payment.received", "deployment.failed", "shipment.delayed", "approval.requested", "approval.completed", "ai.action.executed", "ai.action.failed"]) {
      assert.ok((COMPANY_OS_EVENT_TYPES as readonly string[]).includes(`${t}.v1`), t);
    }
  });
});

describe("lifecycle state machines", () => {
  const machines: StateMachine<string>[] = [LEAD_MACHINE, OPPORTUNITY_MACHINE, CONTRACT_MACHINE, PROJECT_MACHINE, DELIVERABLE_MACHINE, TASK_MACHINE, INVOICE_MACHINE] as StateMachine<string>[];

  it("every machine is internally consistent", () => {
    for (const m of machines) {
      assert.ok(m.initial in m.transitions, `${m.name} initial`);
      for (const [from, tos] of Object.entries(m.transitions)) {
        for (const to of tos as string[]) assert.ok(to in m.transitions, `${m.name}: ${from}→${to} targets unknown state`);
      }
      for (const t of m.terminal) assert.ok(t in m.transitions);
    }
  });

  it("allows the happy path and rejects shortcuts", () => {
    assert.equal(canTransition(OPPORTUNITY_MACHINE, "discovery", "solution").ok, true);
    assert.equal(canTransition(OPPORTUNITY_MACHINE, "discovery", "won").ok, false, "cannot jump to won");
    assert.equal(canTransition(CONTRACT_MACHINE, "draft", "signed").ok, false, "must be sent first");
    assert.equal(canTransition(INVOICE_MACHINE, "draft", "paid").ok, false);
    assert.equal(canTransition(INVOICE_MACHINE, "issued", "paid").ok, true);
    assert.equal(canTransition(DELIVERABLE_MACHINE, "draft", "approved").ok, false);
    assert.equal(canTransition(LEAD_MACHINE, "new", "converted").ok, false, "must qualify first");
    assert.equal(canTransition(TASK_MACHINE, "completed", "todo").ok, false);
  });

  it("rejects no-op and unknown transitions; assertTransition throws", () => {
    assert.equal(canTransition(TASK_MACHINE, "todo", "todo").ok, false);
    assert.throws(() => assertTransition(INVOICE_MACHINE, "paid", "issued"));
    assert.doesNotThrow(() => assertTransition(PROJECT_MACHINE, "planned", "active"));
  });

  it("terminal states have no outgoing transitions (except documented re-open of rejected paths)", () => {
    assert.deepEqual(INVOICE_MACHINE.transitions.paid, []);
    assert.deepEqual(CONTRACT_MACHINE.transitions.signed, []);
    assert.deepEqual(PROJECT_MACHINE.transitions.completed, []);
  });

  it("a client exists only after a signed contract or an active project", () => {
    assert.equal(isClient({ signedContracts: 0, activeProjects: 0 }), false);
    assert.equal(isClient({ signedContracts: 1, activeProjects: 0 }), true);
    assert.equal(isClient({ signedContracts: 0, activeProjects: 1 }), true);
  });

  it("lifecycle map covers lead → renewal and every object is a real table name", () => {
    assert.equal(LIFECYCLE_STAGES[0].id, "lead");
    assert.equal(LIFECYCLE_STAGES[LIFECYCLE_STAGES.length - 1].id, "renewal");
    for (const s of LIFECYCLE_STAGES) assert.match(s.object, /^[a-z_]+$/);
  });
});

describe("catalogue sanity", () => {
  it("is non-empty", () => assert.ok(ACTION_CATALOG.length > 25));
});
