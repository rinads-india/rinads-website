/**
 * RINPO tool observability for the appointment-confirmation pilot (and
 * reusable for other salon tools). Records latency, estimated cost,
 * success/failure, and approved-action completion. Cost budgets are
 * soft-gates for LLM usage; deterministic tools report estimatedCostUsd=0.
 *
 * In-process counters are intentionally process-local (honest for a single
 * serverless instance). They never invent cross-tenant aggregates.
 */

export type RinpoObservation = {
  organizationId: string;
  tool: string;
  ok: boolean;
  latencyMs: number;
  /** Estimated USD for this call (0 for deterministic tools). */
  estimatedCostUsd: number;
  /** True when a pending approval was created (not yet executed). */
  pendingApproval?: boolean;
  /** True when an approved action finished enqueue/execute. */
  approvedActionCompleted?: boolean;
  failureReason?: string;
  at: string;
};

export type RinpoBudgetStatus = {
  allowed: boolean;
  reason?: string;
  toolCallsToday: number;
  estimatedCostUsdToday: number;
  toolCallBudget: number;
  costBudgetUsd: number;
};

type OrgDayBucket = {
  day: string;
  toolCalls: number;
  estimatedCostUsd: number;
  failures: number;
  approvedCompletions: number;
  pendingApprovals: number;
};

const buckets = new Map<string, OrgDayBucket>();

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function getBucket(organizationId: string): OrgDayBucket {
  const day = utcDay();
  const key = `${organizationId}:${day}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.day !== day) {
    bucket = {
      day,
      toolCalls: 0,
      estimatedCostUsd: 0,
      failures: 0,
      approvedCompletions: 0,
      pendingApprovals: 0,
    };
    buckets.set(key, bucket);
  }
  return bucket;
}

function readEnv(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name];
}

function readIntEnv(name: string, fallback: number): number {
  const raw = readEnv(name);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Soft budgets (per org, UTC day, process-local):
 * - RINADS_RINPO_DAILY_TOOL_BUDGET (default 200)
 * - RINADS_RINPO_DAILY_COST_BUDGET_USD (default 5)
 */
export function checkRinpoBudget(organizationId: string): RinpoBudgetStatus {
  const bucket = getBucket(organizationId);
  const toolCallBudget = readIntEnv("RINADS_RINPO_DAILY_TOOL_BUDGET", 200);
  const costBudgetUsd = readIntEnv("RINADS_RINPO_DAILY_COST_BUDGET_USD", 5);
  if (bucket.toolCalls >= toolCallBudget) {
    return {
      allowed: false,
      reason: `Daily RINPO tool-call budget reached (${toolCallBudget}).`,
      toolCallsToday: bucket.toolCalls,
      estimatedCostUsdToday: bucket.estimatedCostUsd,
      toolCallBudget,
      costBudgetUsd,
    };
  }
  if (bucket.estimatedCostUsd >= costBudgetUsd) {
    return {
      allowed: false,
      reason: `Daily RINPO estimated cost budget reached ($${costBudgetUsd}).`,
      toolCallsToday: bucket.toolCalls,
      estimatedCostUsdToday: bucket.estimatedCostUsd,
      toolCallBudget,
      costBudgetUsd,
    };
  }
  return {
    allowed: true,
    toolCallsToday: bucket.toolCalls,
    estimatedCostUsdToday: bucket.estimatedCostUsd,
    toolCallBudget,
    costBudgetUsd,
  };
}

/** Deterministic tools: zero cost. Optional LLM NLU cost is attributed separately when used. */
export function estimateToolCostUsd(_tool: string, usedLlm = false): number {
  if (!usedLlm) return 0;
  const perCall = Number(readEnv("RINADS_RINPO_LLM_COST_PER_CALL_USD") ?? "0.01");
  return Number.isFinite(perCall) && perCall >= 0 ? perCall : 0.01;
}

export function recordRinpoObservation(observation: RinpoObservation): void {
  const bucket = getBucket(observation.organizationId);
  bucket.toolCalls += 1;
  bucket.estimatedCostUsd += observation.estimatedCostUsd;
  if (!observation.ok) bucket.failures += 1;
  if (observation.pendingApproval) bucket.pendingApprovals += 1;
  if (observation.approvedActionCompleted) bucket.approvedCompletions += 1;

  // Structured log for platform log drains — no PII beyond org id + tool key.
  console.info(
    JSON.stringify({
      type: "rinpo.observation",
      ...observation,
      toolCallsToday: bucket.toolCalls,
      estimatedCostUsdToday: bucket.estimatedCostUsd,
      failuresToday: bucket.failures,
      approvedCompletionsToday: bucket.approvedCompletions,
      pendingApprovalsToday: bucket.pendingApprovals,
    })
  );
}

/** Test helper — clears process-local counters. */
export function resetRinpoObservationsForTests(): void {
  buckets.clear();
}

export function getRinpoObservationSnapshot(organizationId: string): OrgDayBucket {
  return { ...getBucket(organizationId) };
}
