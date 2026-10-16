/**
 * Explainable work-allocation recommendations.
 *
 * Hard rules
 *  - Recommendation ONLY. This module never assigns; a human manager decides.
 *  - Every score is the sum of named factors with visible weights and reasons.
 *  - A factor whose input is missing is EXCLUDED (weight redistributed) and the omission is
 *    stated. Nothing is invented to fill a gap.
 *  - Historical delivery is used only when it is verified and the sample is large enough.
 *  - Academy certification can raise skill-fit evidence but never decides employment.
 */

export type ClientPriority = "strategic" | "standard" | "low";

export type AllocationTask = {
  id: string;
  title: string;
  requiredSkills: readonly string[];
  /** Estimated effort in hours; null when unknown. */
  estimateHours: number | null;
  dueAt: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  clientPriority: ClientPriority | null;
  /** True when the task depends on work that is not complete yet. */
  blockedByOpenDependency: boolean;
  preferredRole?: string | null;
  projectId?: string | null;
};

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type PersonCapacity = {
  userId: string;
  name: string;
  roleTitle: string | null;
  status: "active" | "on_leave" | "inactive";
  /** skill key → level; may be empty. */
  skills: Readonly<Record<string, SkillLevel>>;
  /** Skills evidenced by an Academy certification (advisory — raises confidence, not authority). */
  certifiedSkills?: readonly string[];
  weeklyCapacityHours: number | null;
  /** Estimated hours already assigned and open within the planning window. */
  committedHours: number;
  openTaskCount: number;
  /** Verified delivery history, if any. */
  history: { completed: number; onTime: number; verified: boolean } | null;
};

export type FactorKey =
  | "skill_fit"
  | "capacity"
  | "workload"
  | "deadline"
  | "client_priority"
  | "role_fit"
  | "history";

export type Factor = {
  key: FactorKey;
  label: string;
  /** 0..1 contribution before weighting. */
  score: number;
  weight: number;
  detail: string;
  included: boolean;
};

export type Recommendation = {
  userId: string;
  name: string;
  rank: number;
  /** 0..100 */
  total: number;
  eligible: boolean;
  ineligibleReasons: string[];
  warnings: string[];
  factors: Factor[];
  /** Plain-language explanation a manager can read in one pass. */
  explanation: string;
};

export type AllocationResult = {
  taskId: string;
  advisory: true;
  deferred: boolean;
  deferredReason: string | null;
  confidence: "high" | "medium" | "low";
  confidenceNotes: string[];
  recommendations: Recommendation[];
};

export const MIN_VERIFIED_HISTORY = 5;

const BASE_WEIGHTS: Record<FactorKey, number> = {
  skill_fit: 35,
  capacity: 25,
  workload: 10,
  deadline: 10,
  client_priority: 10,
  role_fit: 5,
  history: 5,
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function hoursUntil(dueAt: string | null, now: Date): number | null {
  if (!dueAt) return null;
  return (new Date(dueAt).getTime() - now.getTime()) / 3_600_000;
}

function skillFit(task: AllocationTask, person: PersonCapacity): { factor: Omit<Factor, "weight">; missing: string[] } {
  if (task.requiredSkills.length === 0) {
    return {
      factor: { key: "skill_fit", label: "Skill fit", score: 0, detail: "Task lists no required skills — factor excluded.", included: false },
      missing: [],
    };
  }
  const missing: string[] = [];
  let total = 0;
  const parts: string[] = [];
  for (const skill of task.requiredSkills) {
    const level = person.skills[skill];
    if (!level) {
      missing.push(skill);
      parts.push(`${skill}: none`);
      continue;
    }
    const certified = person.certifiedSkills?.includes(skill) ?? false;
    total += level / 5;
    parts.push(`${skill}: L${level}${certified ? " (certified)" : ""}`);
  }
  const score = total / task.requiredSkills.length;
  return {
    factor: {
      key: "skill_fit",
      label: "Skill fit",
      score: clamp01(score),
      detail: `${parts.join(", ")}.`,
      included: true,
    },
    missing,
  };
}

function capacityFactor(task: AllocationTask, person: PersonCapacity): Omit<Factor, "weight"> & { over: boolean } {
  if (person.weeklyCapacityHours === null) {
    return { key: "capacity", label: "Capacity headroom", score: 0, detail: "Weekly capacity not recorded — factor excluded.", included: false, over: false };
  }
  const headroom = person.weeklyCapacityHours - person.committedHours;
  if (task.estimateHours === null) {
    const score = clamp01(headroom / Math.max(1, person.weeklyCapacityHours));
    return {
      key: "capacity",
      label: "Capacity headroom",
      score,
      detail: `${headroom.toFixed(1)}h free of ${person.weeklyCapacityHours}h/week; task has no estimate so fit cannot be confirmed.`,
      included: true,
      over: headroom <= 0,
    };
  }
  const over = headroom < task.estimateHours;
  const score = over ? clamp01(headroom / task.estimateHours) * 0.4 : clamp01(0.6 + 0.4 * (1 - task.estimateHours / Math.max(headroom, 1)));
  return {
    key: "capacity",
    label: "Capacity headroom",
    score,
    detail: over
      ? `Needs ${task.estimateHours}h but only ${Math.max(0, headroom).toFixed(1)}h free of ${person.weeklyCapacityHours}h/week.`
      : `${headroom.toFixed(1)}h free of ${person.weeklyCapacityHours}h/week; task needs ${task.estimateHours}h.`,
    included: true,
    over,
  };
}

function workloadFactor(person: PersonCapacity, maxOpen: number): Omit<Factor, "weight"> {
  if (maxOpen <= 0) {
    return { key: "workload", label: "Current workload", score: 1, detail: "Nobody has open tasks.", included: true };
  }
  return {
    key: "workload",
    label: "Current workload",
    score: clamp01(1 - person.openTaskCount / (maxOpen + 1)),
    detail: `${person.openTaskCount} open task(s) (team max ${maxOpen}).`,
    included: true,
  };
}

function deadlineFactor(task: AllocationTask, person: PersonCapacity, now: Date): Omit<Factor, "weight"> {
  const hours = hoursUntil(task.dueAt, now);
  if (hours === null) {
    return { key: "deadline", label: "Deadline pressure", score: 0, detail: "No due date — factor excluded.", included: false };
  }
  if (hours <= 0) {
    return { key: "deadline", label: "Deadline pressure", score: 0.2, detail: "Already past due — prefer whoever can start now.", included: true };
  }
  if (person.weeklyCapacityHours === null || task.estimateHours === null) {
    return { key: "deadline", label: "Deadline pressure", score: 0.5, detail: `Due in ${Math.round(hours)}h; effort or capacity unknown so feasibility is not assessed.`, included: true };
  }
  const workDaysLeft = Math.max(hours / 24, 0.25);
  const hoursPerDay = person.weeklyCapacityHours / 5;
  const freePerDay = Math.max(0, person.weeklyCapacityHours - person.committedHours) / 5;
  const feasible = freePerDay * workDaysLeft >= task.estimateHours;
  const score = feasible ? clamp01(0.7 + 0.3 * Math.min(1, (freePerDay * workDaysLeft) / (task.estimateHours * 2))) : clamp01((freePerDay * workDaysLeft) / task.estimateHours) * 0.5;
  return {
    key: "deadline",
    label: "Deadline pressure",
    score,
    detail: feasible
      ? `Due in ~${Math.round(hours)}h; ${(freePerDay * workDaysLeft).toFixed(1)}h of free time before then (needs ${task.estimateHours}h).`
      : `Due in ~${Math.round(hours)}h; only ~${(freePerDay * workDaysLeft).toFixed(1)}h free before then (needs ${task.estimateHours}h; ${hoursPerDay.toFixed(1)}h/day nominal).`,
    included: true,
  };
}

function clientPriorityFactor(task: AllocationTask, skillScore: number | null): Omit<Factor, "weight"> {
  if (!task.clientPriority) {
    return { key: "client_priority", label: "Client priority", score: 0, detail: "No client priority set — factor excluded.", included: false };
  }
  if (skillScore === null) {
    return { key: "client_priority", label: "Client priority", score: 0, detail: "Skill fit unavailable — factor excluded.", included: false };
  }
  // Strategic clients weight skill depth more; low-priority clients are fine with capacity-first assignment.
  const emphasis = task.clientPriority === "strategic" ? 1 : task.clientPriority === "standard" ? 0.6 : 0.3;
  return {
    key: "client_priority",
    label: "Client priority",
    score: clamp01(skillScore * emphasis + (1 - emphasis) * 0.5),
    detail: `${task.clientPriority} client: ${task.clientPriority === "strategic" ? "favour the strongest skill match" : task.clientPriority === "standard" ? "balanced skill and availability" : "capacity-first is acceptable"}.`,
    included: true,
  };
}

function roleFitFactor(task: AllocationTask, person: PersonCapacity): Omit<Factor, "weight"> {
  if (!task.preferredRole) {
    return { key: "role_fit", label: "Role fit", score: 0, detail: "No preferred role — factor excluded.", included: false };
  }
  const match = (person.roleTitle ?? "").toLowerCase() === task.preferredRole.toLowerCase();
  return {
    key: "role_fit",
    label: "Role fit",
    score: match ? 1 : 0.3,
    detail: match ? `Role "${person.roleTitle}" matches preferred role.` : `Preferred role "${task.preferredRole}"; holder is "${person.roleTitle ?? "unrecorded"}".`,
    included: true,
  };
}

function historyFactor(person: PersonCapacity): Omit<Factor, "weight"> {
  const h = person.history;
  if (!h || !h.verified) {
    return { key: "history", label: "Verified delivery history", score: 0, detail: "No verified delivery history — factor excluded.", included: false };
  }
  if (h.completed < MIN_VERIFIED_HISTORY) {
    return {
      key: "history",
      label: "Verified delivery history",
      score: 0,
      detail: `Only ${h.completed} verified completion(s); need ${MIN_VERIFIED_HISTORY} before history is used — factor excluded.`,
      included: false,
    };
  }
  const rate = h.onTime / h.completed;
  return {
    key: "history",
    label: "Verified delivery history",
    score: clamp01(rate),
    detail: `${h.onTime}/${h.completed} verified on-time deliveries (${Math.round(rate * 100)}%).`,
    included: true,
  };
}

export function recommendAssignees(input: {
  task: AllocationTask;
  people: readonly PersonCapacity[];
  now: Date;
  /** Hard requirement that the person holds every required skill. Default: true. */
  requireAllSkills?: boolean;
  limit?: number;
}): AllocationResult {
  const { task, people, now } = input;
  const requireAll = input.requireAllSkills ?? true;
  const maxOpen = people.reduce((m, p) => Math.max(m, p.openTaskCount), 0);

  const scored = people.map((person) => {
    const ineligibleReasons: string[] = [];
    const warnings: string[] = [];

    if (person.status !== "active") ineligibleReasons.push(`Status is ${person.status.replace("_", " ")}.`);

    const skill = skillFit(task, person);
    if (requireAll && skill.missing.length > 0) {
      ineligibleReasons.push(`Missing required skill(s): ${skill.missing.join(", ")}.`);
    } else if (skill.missing.length > 0) {
      warnings.push(`Missing skill(s): ${skill.missing.join(", ")}.`);
    }

    const cap = capacityFactor(task, person);
    if (cap.over) warnings.push("Would exceed recorded weekly capacity.");

    const skillScore = skill.factor.included ? skill.factor.score : null;
    const raw: Omit<Factor, "weight">[] = [
      skill.factor,
      { key: cap.key, label: cap.label, score: cap.score, detail: cap.detail, included: cap.included },
      workloadFactor(person, maxOpen),
      deadlineFactor(task, person, now),
      clientPriorityFactor(task, skillScore),
      roleFitFactor(task, person),
      historyFactor(person),
    ];

    const includedWeightSum = raw.filter((f) => f.included).reduce((s, f) => s + BASE_WEIGHTS[f.key], 0);
    const factors: Factor[] = raw.map((f) => ({
      ...f,
      // Redistribute weight of excluded factors across included ones so totals stay on a 0–100 scale.
      weight: f.included && includedWeightSum > 0 ? (BASE_WEIGHTS[f.key] / includedWeightSum) * 100 : 0,
    }));
    const total = factors.reduce((s, f) => s + (f.included ? f.score * f.weight : 0), 0);

    return { person, factors, total, ineligibleReasons, warnings };
  });

  const ranked = scored
    .sort((a, b) => {
      const ea = a.ineligibleReasons.length === 0 ? 1 : 0;
      const eb = b.ineligibleReasons.length === 0 ? 1 : 0;
      return eb - ea || b.total - a.total || a.person.name.localeCompare(b.person.name);
    })
    .slice(0, input.limit ?? 5);

  const recommendations: Recommendation[] = ranked.map((entry, index) => {
    const top = [...entry.factors].filter((f) => f.included).sort((a, b) => b.score * b.weight - a.score * a.weight);
    const explanation =
      entry.ineligibleReasons.length > 0
        ? `Not eligible: ${entry.ineligibleReasons.join(" ")}`
        : `Scores ${Math.round(entry.total)}/100. Strongest: ${top
            .slice(0, 2)
            .map((f) => `${f.label.toLowerCase()} (${f.detail})`)
            .join("; ")}${entry.warnings.length ? ` Watch: ${entry.warnings.join(" ")}` : ""}`;
    return {
      userId: entry.person.userId,
      name: entry.person.name,
      rank: index + 1,
      total: Math.round(entry.total * 10) / 10,
      eligible: entry.ineligibleReasons.length === 0,
      ineligibleReasons: entry.ineligibleReasons,
      warnings: entry.warnings,
      factors: entry.factors,
      explanation,
    };
  });

  const confidenceNotes: string[] = [];
  if (task.estimateHours === null) confidenceNotes.push("Task has no effort estimate.");
  if (task.requiredSkills.length === 0) confidenceNotes.push("Task lists no required skills.");
  if (people.every((p) => p.weeklyCapacityHours === null)) confidenceNotes.push("No weekly capacity recorded for anyone.");
  if (!task.dueAt) confidenceNotes.push("Task has no due date.");
  if (!people.some((p) => p.history?.verified && p.history.completed >= MIN_VERIFIED_HISTORY)) {
    confidenceNotes.push("No verified delivery history large enough to use.");
  }
  const confidence: AllocationResult["confidence"] = confidenceNotes.length === 0 ? "high" : confidenceNotes.length <= 2 ? "medium" : "low";

  return {
    taskId: task.id,
    advisory: true,
    deferred: task.blockedByOpenDependency,
    deferredReason: task.blockedByOpenDependency ? "Task depends on unfinished work; assigning now will not unblock it." : null,
    confidence,
    confidenceNotes,
    recommendations,
  };
}

export type OverrideDecision = {
  taskId: string;
  recommendedUserId: string | null;
  chosenUserId: string;
  followedRecommendation: boolean;
  /** Required whenever the manager chose someone other than the top eligible recommendation. */
  overrideReason: string | null;
  decidedBy: string;
  factorSnapshot: Recommendation["factors"] | null;
};

export function buildAssignmentDecision(input: {
  result: AllocationResult;
  chosenUserId: string;
  decidedBy: string;
  overrideReason?: string | null;
}): { ok: true; decision: OverrideDecision } | { ok: false; error: string } {
  const top = input.result.recommendations.find((r) => r.eligible) ?? null;
  const chosen = input.result.recommendations.find((r) => r.userId === input.chosenUserId) ?? null;
  const followed = top !== null && top.userId === input.chosenUserId;
  const reason = input.overrideReason?.trim() || null;
  if (!followed && !reason) {
    return { ok: false, error: "A rationale is required when overriding the recommendation (or when none is available)." };
  }
  return {
    ok: true,
    decision: {
      taskId: input.result.taskId,
      recommendedUserId: top?.userId ?? null,
      chosenUserId: input.chosenUserId,
      followedRecommendation: followed,
      overrideReason: followed ? null : reason,
      decidedBy: input.decidedBy,
      factorSnapshot: chosen?.factors ?? null,
    },
  };
}

/** Utilisation of a person's recorded weekly capacity (null if capacity unknown). */
export function utilisation(person: Pick<PersonCapacity, "weeklyCapacityHours" | "committedHours">): number | null {
  if (!person.weeklyCapacityHours || person.weeklyCapacityHours <= 0) return null;
  return Math.round((person.committedHours / person.weeklyCapacityHours) * 100);
}
