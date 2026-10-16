/**
 * Shared primitives for the Company OS domain.
 *
 * Design rule: a fact section is either `available` (with data) or it is not.
 * There is no "estimated" or "synthetic" state — unavailable data produces no
 * metric, no score and no urgency anywhere downstream.
 */

export type SectionState = "available" | "unavailable" | "not_connected";

export type Section<T> =
  | { state: "available"; data: T; asOf: string }
  | { state: "unavailable" | "not_connected"; reason: string };

export function available<T>(data: T, asOf: string): Section<T> {
  return { state: "available", data, asOf };
}

export function unavailable<T = never>(reason: string): Section<T> {
  return { state: "unavailable", reason };
}

export function notConnected<T = never>(reason: string): Section<T> {
  return { state: "not_connected", reason };
}

export function isAvailable<T>(section: Section<T>): section is { state: "available"; data: T; asOf: string } {
  return section.state === "available";
}

/** A single reportable number that may be unavailable. */
export type Metric<T = number> =
  | { state: "available"; value: T }
  | { state: "unavailable" | "not_connected"; reason: string };

export function metric<T>(value: T): Metric<T> {
  return { state: "available", value };
}

export function metricUnavailable<T = never>(reason: string, state: "unavailable" | "not_connected" = "unavailable"): Metric<T> {
  return { state, reason };
}

export type Severity = "info" | "attention" | "critical";

export const SEVERITY_RANK: Record<Severity, number> = { info: 1, attention: 2, critical: 3 };

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const RISK_RANK: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

/** Round to 2 decimal places (currency major units). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumBy<T>(items: readonly T[], pick: (item: T) => number): number {
  let total = 0;
  for (const item of items) total += pick(item);
  return round2(total);
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysBetween(from: Date | string, to: Date | string): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function isBefore(a: string | null | undefined, b: Date): boolean {
  if (!a) return false;
  const t = new Date(a).getTime();
  return Number.isFinite(t) && t < b.getTime();
}

/** Start/end (ISO, UTC) of the Asia/Kolkata calendar day containing `reference`. */
export function istDayBounds(reference: Date): { start: string; end: string } {
  const IST_OFFSET_MS = 330 * 60 * 1000;
  const shifted = new Date(reference.getTime() + IST_OFFSET_MS);
  const startUtc =
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - IST_OFFSET_MS;
  return {
    start: new Date(startUtc).toISOString(),
    end: new Date(startUtc + MS_PER_DAY).toISOString(),
  };
}

export type Actor =
  | { kind: "user"; userId: string }
  | { kind: "agent"; agentRole: string; onBehalfOfUserId: string; provider?: string; model?: string }
  | { kind: "system"; system: string };

export type OrgContext = {
  organizationId: string;
  userId: string;
  roleKey: string | null;
  permissions: readonly string[];
};
