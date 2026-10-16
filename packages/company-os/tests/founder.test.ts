import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  answerCompanyQuestion,
  assessClientRisk,
  available,
  buildAttention,
  buildFounderSnapshot,
  detectBriefingIntent,
  notConnected,
  sortAttention,
  unavailable,
  type AttentionItem,
  type CompanyFacts,
} from "../src";
import { NOW, daysAgo, daysAhead, emptyFacts } from "./fixtures";

const asOf = NOW.toISOString();

function busyFacts(): CompanyFacts {
  return emptyFacts({
    tasks: available(
      [
        { id: "t1", title: "Ship Acme site", status: "in_progress", priority: "urgent", dueAt: daysAgo(2), assigneeId: "u1", projectId: "p1", createdAt: daysAgo(9), updatedAt: daysAgo(1) },
        { id: "t2", title: "Write copy", status: "blocked", priority: "normal", dueAt: daysAhead(1), assigneeId: "u2", projectId: "p1", createdAt: daysAgo(5), updatedAt: daysAgo(3) },
        { id: "t3", title: "Unowned hot task", status: "todo", priority: "high", dueAt: null, assigneeId: null, projectId: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
        { id: "t4", title: "Done today", status: "completed", priority: "low", dueAt: null, assigneeId: "u1", projectId: null, createdAt: daysAgo(4), updatedAt: NOW.toISOString() },
      ],
      asOf
    ),
    companies: available([{ id: "c1", name: "Acme Retail", relationship: "client", ownerId: "u1", priority: "strategic" }], asOf),
    invoices: available(
      [{ id: "i1", number: "INV-1", companyId: "c1", companyName: "Acme Retail", projectId: "p1", status: "issued", issueDate: daysAgo(70), dueDate: daysAgo(40), total: 50000, currency: "INR" }],
      asOf
    ),
    payments: available([{ id: "pay1", invoiceId: null, amount: 12000, currency: "INR", receivedAt: "2026-10-03T00:00:00.000Z" }], asOf),
    opportunities: available(
      [
        { id: "o1", title: "Brand refresh", companyId: "c1", companyName: "Acme Retail", stage: "proposal", amount: 200000, probability: 60, expectedCloseDate: daysAgo(3), ownerId: "u1", stageChangedAt: daysAgo(30), updatedAt: daysAgo(30) },
      ],
      asOf
    ),
    leads: available([{ id: "l1", name: "Priya", company: "Zed", status: "new", source: "website", ownerId: null, createdAt: daysAgo(5), updatedAt: daysAgo(5), lastContactedAt: null }], asOf),
    approvals: available([{ id: "a1", actionType: "invoice.issue", summary: "Issue INV-2 to Acme", risk: "HIGH", requestedAt: daysAgo(2), expiresAt: daysAhead(1), actorKind: "agent", agentRole: "operations_controller", requestedBy: "u1" }], asOf),
    people: available(
      [{ userId: "u1", name: "Asha", roleTitle: "Designer", status: "active", skills: { design: 5 }, weeklyCapacityHours: 40, committedHours: 52, openTaskCount: 5, history: null }],
      asOf
    ),
    engineering: {
      github: available({ repository: "rinads-india/rinads-website", openPullRequests: 3, failingChecks: [{ pr: 121, title: "Founder today", check: "lint" }], defaultBranchCommit: "abc1234" }, asOf),
      vercel: available({ projects: [{ name: "www", state: "ERROR", commitSha: "deadbeefcafe", createdAt: daysAgo(1), ready: false }] }, asOf),
      supabase: available({ healthy: true, detail: "ok", appliedMigrations: 40 }, asOf),
    },
  });
}

describe("attention queue", () => {
  it("is empty (not padded) for a quiet company", () => {
    assert.deepEqual(buildAttention(emptyFacts(), NOW), []);
  });

  it("produces evidence-backed exceptions with owners, why, and next action", () => {
    const items = buildAttention(busyFacts(), NOW);
    const ids = items.map((i) => i.id);
    for (const id of ["work-overdue", "work-blocked", "work-unassigned-urgent", "sales-uncontacted-leads", "sales-stalled-opportunities", "sales-overdue-close", "finance-overdue-invoices", "approvals-pending", "people-over-capacity", "engineering-deployments", "engineering-failing-checks"]) {
      assert.ok(ids.includes(id), `missing ${id}`);
    }
    const overdue = items.find((i) => i.id === "work-overdue")!;
    assert.equal(overdue.severity, "critical", "urgent overdue work is critical");
    assert.deepEqual(overdue.ownerIds, ["u1"]);
    assert.ok(overdue.why.length > 10);
    assert.ok(overdue.evidence[0].includes("Ship Acme site"));
    assert.ok(items.every((i) => i.source === "fact"));
  });

  it("sorts critical first, then by age", () => {
    const items = buildAttention(busyFacts(), NOW);
    const ranks = items.map((i) => ({ critical: 3, attention: 2, info: 1 })[i.severity]);
    assert.deepEqual([...ranks].sort((a, b) => b - a), ranks);
    assert.equal(items[0].severity, "critical");
  });

  it("escalates overdue invoices to critical at 30+ days and marks AI-prepared approvals", () => {
    const items = buildAttention(busyFacts(), NOW);
    assert.equal(items.find((i) => i.id === "finance-overdue-invoices")!.severity, "critical");
    assert.match(items.find((i) => i.id === "approvals-pending")!.evidence[0], /prepared by operations_controller/);
  });

  it("never reports on sections that are unavailable", () => {
    const facts = emptyFacts({ tasks: unavailable("no read access"), invoices: notConnected("n/a"), approvals: unavailable("x") });
    assert.deepEqual(buildAttention(facts, NOW), []);
  });

  it("flags renewals only when no renewal opportunity exists", () => {
    const contract = { id: "k1", title: "Acme retainer", companyId: "c1", status: "signed" as const, value: 1, signedAt: daysAgo(300), endDate: daysAhead(30) };
    const without = buildAttention(emptyFacts({ contracts: available([contract], asOf) }), NOW);
    assert.ok(without.some((i) => i.id === "sales-renewals"));
    const withRenewal = buildAttention(
      emptyFacts({
        contracts: available([contract], asOf),
        opportunities: available([{ id: "o", title: "Acme renewal", companyId: "c1", stage: "discovery", amount: null, probability: null, expectedCloseDate: null, ownerId: null, stageChangedAt: daysAgo(1), updatedAt: daysAgo(1) }], asOf),
      }),
      NOW
    );
    assert.ok(!withRenewal.some((i) => i.id === "sales-renewals"));
  });

  it("flags a high AI failure rate only with enough runs", () => {
    const runs = (n: number, failed: number) =>
      available(Array.from({ length: n }, (_, i) => ({ id: `r${i}`, provider: "xai", model: "grok", agentRole: null, status: i < failed ? ("failed" as const) : ("succeeded" as const), costUsd: 0.01, startedAt: daysAgo(0), errorClass: "timeout" })), asOf);
    assert.ok(!buildAttention(emptyFacts({ aiRuns: runs(4, 4) }), NOW).some((i) => i.id === "ai-failure-rate"), "too few runs");
    assert.ok(buildAttention(emptyFacts({ aiRuns: runs(10, 4) }), NOW).some((i) => i.id === "ai-failure-rate"));
    assert.ok(!buildAttention(emptyFacts({ aiRuns: runs(10, 1) }), NOW).some((i) => i.id === "ai-failure-rate"));
  });
});

describe("client risk", () => {
  it("uses stated rules only", () => {
    const r = assessClientRisk(busyFacts(), NOW);
    assert.equal(r.state, "available");
    if (r.state === "available") {
      assert.equal(r.risks.length, 1);
      assert.equal(r.risks[0].companyName, "Acme Retail");
      assert.equal(r.risks[0].severity, "critical");
      assert.match(r.risks[0].reasons[0], /40 days overdue/);
    }
  });
  it("is unavailable, not empty, when customers cannot be read", () => {
    assert.equal(assessClientRisk(emptyFacts({ companies: unavailable("denied") }), NOW).state, "unavailable");
  });
});

describe("founder snapshot", () => {
  it("builds every section from facts with no composite health score", () => {
    const s = buildFounderSnapshot(busyFacts(), NOW);
    assert.ok(!("score" in s.pulse) && !("health" in s.pulse));
    assert.equal(s.work.state, "available");
    if (s.work.state === "available") {
      assert.equal(s.work.data.open, 3);
      assert.equal(s.work.data.overdue, 1);
      assert.equal(s.work.data.blocked, 1);
      assert.equal(s.work.data.urgent, 1);
      assert.equal(s.work.data.unassigned, 1);
    }
    assert.equal(s.receivables.state === "available" && s.receivables.data.totalOverdue, 50000);
    assert.equal(s.cash.state === "available" && s.cash.data.receivedThisPeriod, 12000);
    assert.equal(s.pipeline.state === "available" && s.pipeline.data.weightedValue, 120000);
    assert.equal(s.capacity.state === "available" && s.capacity.data.overCapacity, 1);
    assert.equal(s.approvals.state === "available" && s.approvals.data.preparedByAgents, 1);
    assert.equal(s.pulse.criticalCount, s.attention.filter((a) => a.severity === "critical").length);
  });

  it("marks unreadable sections and produces NO numbers for them", () => {
    const s = buildFounderSnapshot(emptyFacts({ payments: unavailable("finance not permitted"), invoices: unavailable("finance not permitted"), people: unavailable("people not permitted") }), NOW);
    assert.equal(s.cash.state, "unavailable");
    assert.equal(s.receivables.state, "unavailable");
    assert.equal(s.capacity.state, "unavailable");
    assert.ok(s.pulse.sectionsUnavailable.includes("cash"));
    assert.ok(s.pulse.sectionsUnavailable.includes("capacity"));
    // Disconnected integrations are listed, not faked
    assert.ok(s.pulse.sectionsUnavailable.includes("engineering.github"));
    assert.equal(s.engineering.github.state, "not_connected");
  });

  it("AI cost is null unless every run has a recorded cost", () => {
    const run = (id: string, cost: number | null) => ({ id, provider: "openai", model: "gpt", agentRole: null, status: "succeeded" as const, costUsd: cost, startedAt: daysAgo(0), errorClass: null });
    const partial = buildFounderSnapshot(emptyFacts({ aiRuns: available([run("1", 0.5), run("2", null)], asOf) }), NOW);
    assert.equal(partial.ai.state === "available" && partial.ai.data.costUsd, null);
    const full = buildFounderSnapshot(emptyFacts({ aiRuns: available([run("1", 0.5), run("2", 0.25)], asOf) }), NOW);
    assert.equal(full.ai.state === "available" && full.ai.data.costUsd, 0.75);
    const none = buildFounderSnapshot(emptyFacts({ aiRuns: available([], asOf) }), NOW);
    assert.equal(none.ai.state === "available" && none.ai.data.costUsd, 0);
  });

  it("daily close counts today's IST activity and lists missing sources", () => {
    const s = buildFounderSnapshot(busyFacts(), NOW);
    assert.equal(s.dailyClose.day, "2026-10-16");
    assert.equal(s.dailyClose.tasksCompleted, 1);
    assert.equal(s.dailyClose.approvalsStillPending, 1);
    const missing = buildFounderSnapshot(emptyFacts({ leads: unavailable("x") }), NOW);
    assert.equal(missing.dailyClose.leadsReceived, null);
    assert.ok(missing.dailyClose.unavailable.includes("leads"));
  });

  it("tomorrow priorities come from critical attention, tomorrow's due items and pending approvals", () => {
    const s = buildFounderSnapshot(
      emptyFacts({
        tasks: available([{ id: "t", title: "Due tomorrow", status: "todo", priority: "high", dueAt: "2026-10-17T09:00:00.000Z", assigneeId: "u", projectId: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) }], asOf),
        approvals: available([{ id: "a", actionType: "x", summary: "s", risk: "HIGH", requestedAt: daysAgo(0), expiresAt: null, actorKind: "user", agentRole: null, requestedBy: "u" }], asOf),
      }),
      NOW
    );
    const kinds = s.tomorrowPriorities.map((p) => p.kind);
    assert.ok(kinds.includes("task_due"));
    assert.ok(kinds.includes("approval"));
    assert.ok(s.tomorrowPriorities.length <= 8);
  });
});

describe("RINPO briefing — How is RINADS today?", () => {
  it("detects intents deterministically", () => {
    const cases: [string, string][] = [
      ["How is RINADS today?", "company_status"],
      ["what's overdue and blocked", "work"],
      ["who owes us money", "receivables"],
      ["how's the sales pipeline", "pipeline"],
      ["which clients are at risk", "clients_at_risk"],
      ["is the team overbooked", "capacity"],
      ["anything waiting on me", "approvals"],
      ["did the deployment fail", "engineering"],
      ["how much are we spending on AI models", "ai"],
      ["what should we do tomorrow", "tomorrow"],
      ["", "unknown"],
    ];
    for (const [q, intent] of cases) assert.equal(detectBriefingIntent(q), intent, q);
  });

  it("answers from facts: what happened, at risk, why, owner, next, can execute, needs approval", () => {
    const snap = buildFounderSnapshot(busyFacts(), NOW);
    const names = new Map([["u1", "Asha"], ["u2", "Bilal"]]);
    const b = answerCompanyQuestion("How is RINADS today?", snap, { memberNames: names });
    assert.equal(b.basis, "facts");
    assert.match(b.headline, /critical item/);
    assert.ok(b.atRisk.length > 0);
    assert.ok(b.atRisk.some((r) => r.owners.includes("Asha")), "owner names resolved from members");
    assert.ok(b.atRisk.every((r) => r.why.length > 0 && r.evidence.length > 0));
    assert.ok(b.whyItMatters.length > 0);
    assert.ok(b.nextSteps.length > 0);
    assert.ok(b.requiresApproval.length > 0, "deployment/ads-type steps are approval-gated");
    assert.ok(b.canExecute.every((a) => !a.requiresApproval));
    assert.match(b.text, /At risk:/);
    assert.match(b.text, /Answered from recorded company data only/);
  });

  it("lists unavailable sections instead of estimating them", () => {
    const snap = buildFounderSnapshot(emptyFacts({ invoices: unavailable("finance not permitted") }), NOW);
    const b = answerCompanyQuestion("how are receivables?", snap);
    assert.match(b.headline, /cannot be summarised/);
    assert.ok(b.unavailable.some((u) => u.section === "receivables" && /finance not permitted/.test(u.reason)));
    assert.doesNotMatch(b.text, /₹\d/);
  });

  it("states a clean company honestly", () => {
    const snap = buildFounderSnapshot(emptyFacts(), NOW);
    const b = answerCompanyQuestion("how is the company", snap);
    assert.match(b.headline, /0 critical items/);
    assert.equal(b.atRisk.length, 0);
  });

  it("never claims an action executed; it only prepares", () => {
    const b = answerCompanyQuestion("how is rinads today", buildFounderSnapshot(busyFacts(), NOW));
    assert.doesNotMatch(b.text, /\b(I have|I've) (sent|paid|deployed|approved|issued)/i);
    assert.match(b.text, /I prepare actions; a permitted person decides\./);
  });
});

describe("attention ordering", () => {
  const item = (id: string, category: AttentionItem["category"], severity: AttentionItem["severity"], oldestAt: string | null): AttentionItem => ({
    id,
    category,
    severity,
    title: id,
    why: "",
    evidence: [],
    count: 1,
    ownerIds: [],
    href: "/os",
    nextAction: { label: "", executable: false, requiresApproval: false },
    oldestAt,
    source: "fact",
  });

  it("severity wins, then pending decisions come before other work of the same severity", () => {
    const sorted = sortAttention([
      item("old-work", "work", "attention", "2026-01-01T00:00:00Z"),
      item("approval", "approvals", "attention", "2026-09-01T00:00:00Z"),
      item("critical-work", "work", "critical", "2026-10-01T00:00:00Z"),
    ]);
    assert.deepEqual(sorted.map((i) => i.id), ["critical-work", "approval", "old-work"]);
  });

  it("is deterministic regardless of input order", () => {
    const items = [item("b", "sales", "info", null), item("a", "sales", "info", null), item("c", "approvals", "info", "2026-10-01T00:00:00Z")];
    assert.deepEqual(sortAttention(items).map((i) => i.id), sortAttention([...items].reverse()).map((i) => i.id));
  });
});
