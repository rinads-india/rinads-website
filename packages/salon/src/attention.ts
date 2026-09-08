/**
 * `computeAttentionItems` — the single ranking implementation behind "what
 * needs attention now?", consumed by both the `apps/rinaglow` `/dashboard`
 * route and RINPO's `get_salon_business_summary` read tool (see plan Part
 * F). Pure and dependency-free: callers gather signal counts from
 * `@rinads/salon-server`'s intelligence functions and pass them in here —
 * this module never talks to a database, so "what needs attention" is one
 * implementation, not two.
 *
 * If a signal has no data (count === 0 and no explicit `hasEvidence`
 * override), it is dropped rather than fabricated into a ranked item.
 */

export type AttentionSignalKind =
  | "empty_slots_today"
  | "pending_payments"
  | "reactivation_candidates"
  | "unconfirmed_bookings"
  | "low_staff_utilization";

export type AttentionSignalInput = {
  kind: AttentionSignalKind;
  /** How many instances of this signal exist right now (e.g. 3 pending payments). */
  count: number;
  /** Optional extra context surfaced to the caller/UI, not used for scoring. */
  detail?: Record<string, unknown>;
};

export type AttentionItem = {
  kind: AttentionSignalKind;
  title: string;
  description: string;
  count: number;
  /** 0–100: how much revenue/customer-experience impact this signal carries. */
  impact: number;
  /** 0–100: how time-sensitive acting on this signal is. */
  urgency: number;
  /** 0–1: how confident the underlying data makes this call. */
  confidence: number;
  /** Whether acting on this is easily undone if wrong. */
  reversible: boolean;
  /** Composite ranking score (higher = more worth showing first). */
  score: number;
  detail?: Record<string, unknown>;
};

type SignalMeta = {
  title: string;
  describe: (count: number) => string;
  impact: number;
  urgency: number;
  confidence: number;
  reversible: boolean;
};

const SIGNAL_META: Record<AttentionSignalKind, SignalMeta> = {
  empty_slots_today: {
    title: "Empty slots today",
    describe: (n) => `${n} bookable slot${n === 1 ? "" : "s"} today are still empty.`,
    impact: 55,
    urgency: 70,
    confidence: 0.9,
    reversible: true,
  },
  pending_payments: {
    title: "Pending payments",
    describe: (n) => `${n} sale${n === 1 ? "" : "s"} awaiting payment.`,
    impact: 85,
    urgency: 75,
    confidence: 0.95,
    reversible: true,
  },
  reactivation_candidates: {
    title: "Customers going quiet",
    describe: (n) => `${n} customer${n === 1 ? "" : "s"} haven't booked in a while — good reactivation targets.`,
    impact: 60,
    urgency: 30,
    confidence: 0.7,
    reversible: true,
  },
  unconfirmed_bookings: {
    title: "Unconfirmed bookings",
    describe: (n) => `${n} upcoming booking${n === 1 ? "" : "s"} still need confirmation.`,
    impact: 50,
    urgency: 80,
    confidence: 0.9,
    reversible: true,
  },
  low_staff_utilization: {
    title: "Low staff utilization",
    describe: (n) => `${n} staff member${n === 1 ? "" : "s"} have low booking utilization this week.`,
    impact: 45,
    urgency: 25,
    confidence: 0.6,
    reversible: true,
  },
};

function scoreOf(meta: SignalMeta): number {
  const reversibilityBonus = meta.reversible ? 5 : 0;
  return meta.impact * 0.4 + meta.urgency * 0.4 + meta.confidence * 100 * 0.2 + reversibilityBonus * 0.1;
}

export function computeAttentionItems(signals: AttentionSignalInput[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const signal of signals) {
    if (!signal.count || signal.count <= 0) continue; // no evidence — never fabricate an item.
    const meta = SIGNAL_META[signal.kind];
    if (!meta) continue;
    items.push({
      kind: signal.kind,
      title: meta.title,
      description: meta.describe(signal.count),
      count: signal.count,
      impact: meta.impact,
      urgency: meta.urgency,
      confidence: meta.confidence,
      reversible: meta.reversible,
      score: scoreOf(meta),
      detail: signal.detail,
    });
  }
  return items.sort((a, b) => b.score - a.score);
}
