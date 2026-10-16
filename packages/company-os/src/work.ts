import { recommendAssignees, type AllocationResult, type AllocationTask, type ClientPriority } from "./allocation";
import type { CompanyFacts, TaskFact } from "./facts";
import { isAvailable } from "./types";

/**
 * Build the allocation inputs for a task from the facts the caller may see.
 * Nothing is inferred: missing estimates, skills or priorities stay missing and are reported by the engine.
 */
export function allocationTaskFromFacts(task: TaskFact, facts: CompanyFacts): AllocationTask {
  const open = isAvailable(facts.tasks)
    ? new Set(facts.tasks.data.filter((t) => t.status !== "completed" && t.status !== "cancelled").map((t) => t.id))
    : new Set<string>();

  let clientPriority: ClientPriority | null = null;
  if (task.projectId && isAvailable(facts.projects) && isAvailable(facts.companies)) {
    const project = facts.projects.data.find((p) => p.id === task.projectId);
    const company = project?.companyId ? facts.companies.data.find((c) => c.id === project.companyId) : undefined;
    clientPriority = company?.priority ?? null;
  }

  return {
    id: task.id,
    title: task.title,
    requiredSkills: task.requiredSkills ?? [],
    estimateHours: task.estimateHours ?? null,
    dueAt: task.dueAt,
    priority: task.priority,
    clientPriority,
    blockedByOpenDependency: (task.blockedBy ?? []).some((id) => open.has(id)),
    projectId: task.projectId,
  };
}

export type TaskRecommendation = { task: TaskFact; result: AllocationResult };

/** Recommendations for the open tasks most worth a manager's attention: unassigned, or high/urgent. */
export function recommendForOpenTasks(facts: CompanyFacts, now: Date, limit = 5): { state: "available"; items: TaskRecommendation[] } | { state: "unavailable"; reason: string } {
  if (!isAvailable(facts.tasks)) return { state: "unavailable", reason: "Tasks are not readable." };
  if (!isAvailable(facts.people)) return { state: "unavailable", reason: "Team skills and capacity are not readable by your role (people.read)." };
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  const candidates = facts.tasks.data
    .filter((t) => (t.status === "todo" || t.status === "in_progress" || t.status === "blocked") && (!t.assigneeId || t.priority === "urgent" || t.priority === "high"))
    .sort((a, b) => Number(!!a.assigneeId) - Number(!!b.assigneeId) || rank[a.priority] - rank[b.priority] || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"))
    .slice(0, limit);
  const people = facts.people.data.filter((p) => !p.userId.startsWith("profile:"));
  return {
    state: "available",
    items: candidates.map((task) => ({ task, result: recommendAssignees({ task: allocationTaskFromFacts(task, facts), people, now }) })),
  };
}
