/**
 * Server-side audience evaluator (R GLOW Phase E, Slice 1). Computes
 * on-the-fly from `SalonRepository`'s existing `listCustomers` +
 * `getCustomerSpendSummary`/`getCustomerProfile` aggregates — there is no
 * second, separately-maintained CRM copy of visit counts or spend. The
 * actual eligibility predicate is `matchesSegment` from `@rinads/salon`,
 * so preview-time and send-time evaluation are always the exact same
 * check, never two implementations that could silently drift apart.
 */
import { matchesSegment, ok, type Result, type SalonCustomer, type SegmentCriteria, type SegmentMatchInput } from "@rinads/salon";
import type { SalonRepository } from "./repository";

export type SegmentEvaluationResult = {
  eligible: SalonCustomer[];
  excluded: Array<{ customer: SalonCustomer; reason: string }>;
};

export async function evaluateSegment(
  repo: SalonRepository,
  organizationId: string,
  criteria: SegmentCriteria
): Promise<Result<SegmentEvaluationResult>> {
  const customersResult = await repo.listCustomers(organizationId);
  if (!customersResult.ok) return customersResult;

  // Preferred staff/service/branch require the fuller (appointment-history-
  // derived) profile; skip that extra round-trip per customer when the
  // criteria doesn't need it.
  const needsProfile = criteria.preferredServiceId !== undefined || criteria.preferredStaffId !== undefined || criteria.branchId !== undefined;

  const eligible: SalonCustomer[] = [];
  const excluded: Array<{ customer: SalonCustomer; reason: string }> = [];

  for (const customer of customersResult.data) {
    let input: SegmentMatchInput;

    if (needsProfile) {
      const profileResult = await repo.getCustomerProfile(organizationId, customer.id);
      if (!profileResult.ok) {
        excluded.push({ customer, reason: "Could not load customer profile." });
        continue;
      }
      input = {
        visitCount: profileResult.data.spend.visitCount,
        lifetimeSpend: profileResult.data.spend.totalSpend,
        lastVisitAt: profileResult.data.spend.lastVisitAt,
        preferredStaffId: profileResult.data.preferredStaffId,
        preferredServiceId: profileResult.data.preferredServiceId,
        // Best-effort: the branch of the customer's most recent visit — there is no separate "home branch" field on salon_customers.
        branchId: profileResult.data.history[0]?.branchId,
        optedOutAt: customer.optedOutAt,
        preferredChannel: customer.preferredChannel,
      };
    } else {
      const spendResult = await repo.getCustomerSpendSummary(customer.id);
      if (!spendResult.ok) {
        excluded.push({ customer, reason: "Could not load customer spend summary." });
        continue;
      }
      input = {
        visitCount: spendResult.data.visitCount,
        lifetimeSpend: spendResult.data.totalSpend,
        lastVisitAt: spendResult.data.lastVisitAt,
        optedOutAt: customer.optedOutAt,
        preferredChannel: customer.preferredChannel,
      };
    }

    const match = matchesSegment(input, criteria);
    if (match.matches) {
      eligible.push(customer);
    } else {
      excluded.push({ customer, reason: match.excludeReason });
    }
  }

  return ok({ eligible, excluded });
}
