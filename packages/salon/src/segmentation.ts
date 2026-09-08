import type { PreferredChannel, SegmentCriteria } from "./types";

export type SegmentMatchInput = {
  visitCount: number;
  lifetimeSpend: number;
  /** ISO 8601 timestamp of the customer's most recent non-cancelled visit, or undefined if they've never visited. */
  lastVisitAt?: string;
  preferredStaffId?: string;
  preferredServiceId?: string;
  branchId?: string;
  optedOutAt?: string;
  preferredChannel: PreferredChannel;
};

export type SegmentMatchResult = { matches: true } | { matches: false; excludeReason: string };

/**
 * Pure predicate shared by the server-side audience evaluator
 * (`@rinads/salon-server`'s `evaluateSegment`) and this package's own unit
 * tests, so "does this customer qualify" is one implementation checked
 * once, not re-derived at both preview and send time. Every criterion is
 * optional and AND-ed together; an unset criterion never excludes anyone.
 * Consent (`communicationOptIn`) defaults to `true` — a caller must
 * explicitly set it to `false` to include opted-out customers (never the
 * default, and never silently ignored).
 */
export function matchesSegment(input: SegmentMatchInput, criteria: SegmentCriteria): SegmentMatchResult {
  const requireOptIn = criteria.communicationOptIn ?? true;
  if (requireOptIn && input.optedOutAt) {
    return { matches: false, excludeReason: "Customer has opted out of communications." };
  }
  if (requireOptIn && input.preferredChannel === "none") {
    return { matches: false, excludeReason: "Customer has no preferred communication channel." };
  }

  if (criteria.lastVisitBeforeDays !== undefined) {
    if (!input.lastVisitAt) {
      return { matches: false, excludeReason: "Customer has never visited." };
    }
    const daysSinceVisit = (Date.now() - new Date(input.lastVisitAt).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceVisit < criteria.lastVisitBeforeDays) {
      return { matches: false, excludeReason: `Last visit was only ${Math.floor(daysSinceVisit)} day(s) ago.` };
    }
  }

  if (criteria.minVisits !== undefined && input.visitCount < criteria.minVisits) {
    return { matches: false, excludeReason: `Only ${input.visitCount} visit(s), fewer than the required ${criteria.minVisits}.` };
  }

  if (criteria.minLifetimeSpend !== undefined && input.lifetimeSpend < criteria.minLifetimeSpend) {
    return { matches: false, excludeReason: `Lifetime spend ${input.lifetimeSpend} is below the required ${criteria.minLifetimeSpend}.` };
  }

  if (criteria.maxLifetimeSpend !== undefined && input.lifetimeSpend > criteria.maxLifetimeSpend) {
    return { matches: false, excludeReason: `Lifetime spend ${input.lifetimeSpend} is above the maximum ${criteria.maxLifetimeSpend}.` };
  }

  if (criteria.preferredServiceId !== undefined && input.preferredServiceId !== criteria.preferredServiceId) {
    return { matches: false, excludeReason: "Customer's preferred service doesn't match." };
  }

  if (criteria.preferredStaffId !== undefined && input.preferredStaffId !== criteria.preferredStaffId) {
    return { matches: false, excludeReason: "Customer's preferred staff member doesn't match." };
  }

  if (criteria.branchId !== undefined && input.branchId !== criteria.branchId) {
    return { matches: false, excludeReason: "Customer's branch doesn't match." };
  }

  return { matches: true };
}
