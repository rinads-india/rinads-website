import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAssignmentDecision, MIN_VERIFIED_HISTORY, recommendAssignees, utilisation, type AllocationTask, type PersonCapacity } from "../src";
import { NOW, daysAhead } from "./fixtures";

const task = (t: Partial<AllocationTask> = {}): AllocationTask => ({
  id: "t1",
  title: "Design landing page",
  requiredSkills: ["design"],
  estimateHours: 10,
  dueAt: daysAhead(5),
  priority: "high",
  clientPriority: "strategic",
  blockedByOpenDependency: false,
  preferredRole: null,
  ...t,
});

const person = (p: Partial<PersonCapacity> & Pick<PersonCapacity, "userId" | "name">): PersonCapacity => ({
  roleTitle: "Designer",
  status: "active",
  skills: { design: 4 },
  weeklyCapacityHours: 40,
  committedHours: 10,
  openTaskCount: 2,
  history: null,
  ...p,
});

describe("work allocation", () => {
  it("is advisory only and ranks by skill, capacity and workload with a visible factor breakdown", () => {
    const r = recommendAssignees({
      task: task(),
      now: NOW,
      people: [
        person({ userId: "a", name: "Asha", skills: { design: 5 }, committedHours: 5, openTaskCount: 1 }),
        person({ userId: "b", name: "Bilal", skills: { design: 2 }, committedHours: 30, openTaskCount: 6 }),
        person({ userId: "c", name: "Chitra", skills: { design: 4 }, committedHours: 20, openTaskCount: 3 }),
      ],
    });
    assert.equal(r.advisory, true);
    assert.deepEqual(r.recommendations.map((x) => x.userId), ["a", "c", "b"]);
    const top = r.recommendations[0];
    assert.ok(top.factors.some((f) => f.key === "skill_fit" && f.included));
    assert.ok(top.explanation.includes("Scores"));
    const weightSum = top.factors.filter((f) => f.included).reduce((s, f) => s + f.weight, 0);
    assert.ok(Math.abs(weightSum - 100) < 0.001, "included weights always renormalise to 100");
    assert.ok(top.total <= 100 && top.total >= 0);
  });

  it("excludes missing-input factors instead of inventing values and lowers confidence", () => {
    const r = recommendAssignees({
      task: task({ estimateHours: null, dueAt: null, clientPriority: null, requiredSkills: [] }),
      now: NOW,
      people: [person({ userId: "a", name: "Asha", weeklyCapacityHours: null })],
    });
    const f = r.recommendations[0].factors;
    for (const key of ["skill_fit", "capacity", "deadline", "client_priority", "role_fit", "history"] as const) {
      assert.equal(f.find((x) => x.key === key)?.included, false, `${key} must be excluded`);
    }
    assert.equal(r.confidence, "low");
    assert.ok(r.confidenceNotes.length >= 3);
  });

  it("makes people without a required skill ineligible and ranks them last", () => {
    const r = recommendAssignees({
      task: task({ requiredSkills: ["design", "motion"] }),
      now: NOW,
      people: [person({ userId: "a", name: "Asha", skills: { design: 5 } }), person({ userId: "b", name: "Bilal", skills: { design: 3, motion: 3 } })],
    });
    assert.equal(r.recommendations[0].userId, "b");
    const a = r.recommendations.find((x) => x.userId === "a")!;
    assert.equal(a.eligible, false);
    assert.match(a.ineligibleReasons.join(" "), /motion/);
  });

  it("can relax the hard skill requirement but still warns", () => {
    const r = recommendAssignees({ task: task({ requiredSkills: ["design", "motion"] }), now: NOW, requireAllSkills: false, people: [person({ userId: "a", name: "Asha", skills: { design: 5 } })] });
    assert.equal(r.recommendations[0].eligible, true);
    assert.match(r.recommendations[0].warnings.join(" "), /Missing skill/);
  });

  it("never recommends someone on leave / inactive as eligible", () => {
    const r = recommendAssignees({ task: task(), now: NOW, people: [person({ userId: "a", name: "Asha", status: "on_leave" })] });
    assert.equal(r.recommendations[0].eligible, false);
  });

  it("penalises over-capacity and warns", () => {
    const r = recommendAssignees({
      task: task({ estimateHours: 20 }),
      now: NOW,
      people: [person({ userId: "a", name: "Asha", committedHours: 35 }), person({ userId: "b", name: "Bilal", committedHours: 5 })],
    });
    assert.equal(r.recommendations[0].userId, "b");
    assert.match(r.recommendations.find((x) => x.userId === "a")!.warnings.join(" "), /capacity/i);
  });

  it("uses delivery history only when verified AND at least the minimum sample", () => {
    const base = { task: task(), now: NOW };
    const small = recommendAssignees({ ...base, people: [person({ userId: "a", name: "A", history: { completed: MIN_VERIFIED_HISTORY - 1, onTime: 4, verified: true } })] });
    assert.equal(small.recommendations[0].factors.find((f) => f.key === "history")!.included, false);
    const unverified = recommendAssignees({ ...base, people: [person({ userId: "a", name: "A", history: { completed: 50, onTime: 50, verified: false } })] });
    assert.equal(unverified.recommendations[0].factors.find((f) => f.key === "history")!.included, false);
    const ok = recommendAssignees({ ...base, people: [person({ userId: "a", name: "A", history: { completed: 10, onTime: 9, verified: true } })] });
    const h = ok.recommendations[0].factors.find((f) => f.key === "history")!;
    assert.equal(h.included, true);
    assert.equal(h.score, 0.9);
  });

  it("defers when the task is blocked by an open dependency", () => {
    const r = recommendAssignees({ task: task({ blockedByOpenDependency: true }), now: NOW, people: [person({ userId: "a", name: "A" })] });
    assert.equal(r.deferred, true);
    assert.match(r.deferredReason ?? "", /depends/);
  });

  it("strategic clients favour skill depth over raw availability", () => {
    const people = [
      person({ userId: "expert", name: "Expert", skills: { design: 5 }, committedHours: 22, openTaskCount: 4 }),
      person({ userId: "free", name: "Free", skills: { design: 2 }, committedHours: 0, openTaskCount: 0 }),
    ];
    const strategic = recommendAssignees({ task: task({ clientPriority: "strategic" }), now: NOW, people });
    assert.equal(strategic.recommendations[0].userId, "expert");
  });

  it("is deterministic (stable tie-break by name)", () => {
    const people = [person({ userId: "b", name: "Bea" }), person({ userId: "a", name: "Ann" })];
    const a = recommendAssignees({ task: task(), now: NOW, people });
    const b = recommendAssignees({ task: task(), now: NOW, people: [...people].reverse() });
    assert.deepEqual(a.recommendations.map((r) => r.userId), b.recommendations.map((r) => r.userId));
  });

  it("override requires a rationale; following the top eligible pick does not", () => {
    const r = recommendAssignees({ task: task(), now: NOW, people: [person({ userId: "a", name: "Asha", skills: { design: 5 } }), person({ userId: "b", name: "Bilal", skills: { design: 2 } })] });
    const followed = buildAssignmentDecision({ result: r, chosenUserId: "a", decidedBy: "mgr" });
    assert.ok(followed.ok && followed.decision.followedRecommendation && followed.decision.overrideReason === null);
    const bad = buildAssignmentDecision({ result: r, chosenUserId: "b", decidedBy: "mgr" });
    assert.equal(bad.ok, false);
    const good = buildAssignmentDecision({ result: r, chosenUserId: "b", decidedBy: "mgr", overrideReason: "Bilal is shadowing the client lead" });
    assert.ok(good.ok && !good.decision.followedRecommendation);
    assert.equal(good.ok && good.decision.recommendedUserId, "a");
    assert.equal(good.ok && good.decision.overrideReason, "Bilal is shadowing the client lead");
  });

  it("utilisation is null when capacity is unknown", () => {
    assert.equal(utilisation({ weeklyCapacityHours: null, committedHours: 10 }), null);
    assert.equal(utilisation({ weeklyCapacityHours: 40, committedHours: 50 }), 125);
  });
});

import { allocationTaskFromFacts, available, recommendForOpenTasks, unavailable } from "../src";
import { emptyFacts } from "./fixtures";

describe("allocation inputs from facts", () => {
  const asOf = NOW.toISOString();
  const task = (t: Record<string, unknown> = {}) => ({ id: "t1", title: "Build", status: "todo" as const, priority: "high" as const, dueAt: daysAhead(3), assigneeId: null, projectId: "p1", createdAt: asOf, updatedAt: asOf, estimateHours: 6, requiredSkills: ["design"], blockedBy: [] as string[], ...t });
  const facts = (tasks: ReturnType<typeof task>[]) =>
    emptyFacts({
      tasks: available(tasks, asOf),
      projects: available([{ id: "p1", name: "P", companyId: "c1", kind: "project", status: "active", dueDate: null, ownerId: null, updatedAt: asOf }], asOf),
      companies: available([{ id: "c1", name: "Acme", relationship: "client", ownerId: null, priority: "strategic" }], asOf),
      people: available([person({ userId: "u1", name: "Asha" })], asOf),
    });

  it("resolves client priority through project → company and detects open dependencies", () => {
    const blocker = task({ id: "b1", status: "in_progress", blockedBy: [] });
    const t = task({ blockedBy: ["b1"] });
    const a = allocationTaskFromFacts(t, facts([t, blocker]));
    assert.equal(a.clientPriority, "strategic");
    assert.equal(a.blockedByOpenDependency, true);
    const done = allocationTaskFromFacts(t, facts([t, { ...blocker, status: "completed" as const }]));
    assert.equal(done.blockedByOpenDependency, false);
  });

  it("leaves missing inputs missing (no guessed estimate, skills or priority)", () => {
    const bare = { ...task(), estimateHours: undefined, requiredSkills: undefined, projectId: null };
    const a = allocationTaskFromFacts(bare as never, facts([bare as never]));
    assert.equal(a.estimateHours, null);
    assert.deepEqual(a.requiredSkills, []);
    assert.equal(a.clientPriority, null);
  });

  it("recommends for unassigned / hot tasks only, and is unavailable without people.read", () => {
    const r = recommendForOpenTasks(facts([task(), task({ id: "t2", priority: "low", assigneeId: "u9" })]), NOW);
    assert.equal(r.state, "available");
    assert.deepEqual(r.state === "available" && r.items.map((i) => i.task.id), ["t1"]);
    assert.equal(r.state === "available" && r.items[0].result.recommendations[0].userId, "u1");
    const denied = recommendForOpenTasks({ ...facts([task()]), people: unavailable("no people.read") }, NOW);
    assert.equal(denied.state, "unavailable");
  });
});
