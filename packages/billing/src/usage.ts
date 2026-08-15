import type { PlanLimits } from "./index";

export type UsageCounter = {
  organizationId: string;
  metricKey: string;
  periodStart: string;
  value: number;
};

export function currentPeriodStart(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function incrementUsageCounter(
  counters: UsageCounter[],
  organizationId: string,
  metricKey: string,
  delta = 1
): UsageCounter[] {
  const periodStart = currentPeriodStart();
  const existing = counters.find(
    (c) => c.organizationId === organizationId && c.metricKey === metricKey && c.periodStart === periodStart
  );
  if (existing) {
    return counters.map((c) =>
      c === existing ? { ...c, value: c.value + delta } : c
    );
  }
  return [...counters, { organizationId, metricKey, periodStart, value: delta }];
}

export function getUsageValue(
  counters: UsageCounter[],
  organizationId: string,
  metricKey: string,
  periodStart = currentPeriodStart()
): number {
  return counters.find(
    (c) => c.organizationId === organizationId && c.metricKey === metricKey && c.periodStart === periodStart
  )?.value ?? 0;
}

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; metricKey: string; limit: number; current: number };

export function checkUsageLimit(
  counters: UsageCounter[],
  organizationId: string,
  metricKey: keyof PlanLimits & string,
  limits: PlanLimits,
  delta = 1
): LimitCheckResult {
  if (metricKey === "ordersPerMonth") {
    const limit = limits.ordersPerMonth;
    if (limit == null) return { allowed: true };
    const current = getUsageValue(counters, organizationId, "orders/month");
    if (current + delta > limit) {
      return {
        allowed: false,
        reason: `Monthly order limit (${limit}) reached. Upgrade your plan to continue.`,
        metricKey: "orders/month",
        limit,
        current,
      };
    }
  }
  if (metricKey === "seats") {
    const limit = limits.seats;
    if (limit == null) return { allowed: true };
    const current = getUsageValue(counters, organizationId, "seats");
    if (current + delta > limit) {
      return {
        allowed: false,
        reason: `Seat limit (${limit}) reached. Upgrade your plan to add members.`,
        metricKey: "seats",
        limit,
        current,
      };
    }
  }
  return { allowed: true };
}

export function recordOrderPlaced(
  counters: UsageCounter[],
  organizationId: string
): UsageCounter[] {
  return incrementUsageCounter(counters, organizationId, "orders/month", 1);
}
