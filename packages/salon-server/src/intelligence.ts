/**
 * Reusable salon intelligence signal functions (Part F). Both the
 * `apps/rinaglow` `/dashboard` route and RINPO's READ tools call these same
 * functions — "what needs attention" is one implementation, not two. Every
 * function here is a thin, honest aggregation over `SalonRepository`
 * results; if there is no data for a signal it returns an empty/zero
 * result rather than fabricating one.
 */
import {
  computeAttentionItems,
  generateDaySlots,
  intersectWeeklyHours,
  type AttentionItem,
  type CampaignStatus,
  type SalonAppointment,
  type SalonBranch,
  type SalonStaff,
} from "@rinads/salon";
import type { SalonCampaignsRepository } from "./campaigns-repository";
import type { SalonRow, SalonSupabaseClient } from "./client";
import type { SalonRepository } from "./repository";

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return startOfDayUtc(a).getTime() === startOfDayUtc(b).getTime();
}

export type TodayAppointmentsResult = {
  date: string;
  total: number;
  byStatus: Record<string, number>;
  appointments: SalonAppointment[];
};

export async function getTodayAppointments(
  repo: SalonRepository,
  organizationId: string,
  branchId?: string,
  now: Date = new Date()
): Promise<TodayAppointmentsResult> {
  const result = await repo.listAppointments(organizationId, { branchId });
  const appointments = result.ok ? result.data.filter((a) => isSameUtcDay(new Date(a.startsAt), now)) : [];
  const byStatus: Record<string, number> = {};
  for (const appt of appointments) byStatus[appt.status] = (byStatus[appt.status] ?? 0) + 1;
  return { date: startOfDayUtc(now).toISOString().slice(0, 10), total: appointments.length, byStatus, appointments };
}

export type StaffUtilization = {
  staffId: string;
  staffName: string;
  bookedMinutes: number;
  availableMinutes: number;
  utilizationPct: number;
};

/** Utilization for a single UTC calendar day, per staff member at the given branch(es). */
export async function getStaffUtilization(
  repo: SalonRepository,
  organizationId: string,
  day: Date = new Date()
): Promise<StaffUtilization[]> {
  const [staffResult, branchesResult, appointmentsResult] = await Promise.all([
    repo.listStaff(organizationId),
    repo.listBranches(organizationId),
    repo.listAppointments(organizationId),
  ]);
  if (!staffResult.ok || !branchesResult.ok || !appointmentsResult.ok) return [];

  const branchesById = new Map(branchesResult.data.map((b) => [b.id, b]));
  const dayStart = startOfDayUtc(day);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return staffResult.data
    .filter((s) => s.isActive)
    .map((staff) => {
      const bookedMinutes = appointmentsResult.data
        .filter(
          (a) =>
            a.staffId === staff.id &&
            a.status !== "cancelled" &&
            a.status !== "no_show" &&
            new Date(a.startsAt).getTime() < dayEnd.getTime() &&
            new Date(a.endsAt).getTime() > dayStart.getTime()
        )
        .reduce((sum, a) => sum + (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000, 0);

      const branch = staff.branchId ? branchesById.get(staff.branchId) : undefined;
      const effectiveHours = branch ? intersectWeeklyHours(branch.workingHours, staff.workingHours) : staff.workingHours;
      const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayStart.getUTCDay()] as keyof typeof effectiveHours;
      const hours = effectiveHours[dayKey];
      const availableMinutes = hours
        ? (Number(hours.close.split(":")[0]) * 60 + Number(hours.close.split(":")[1]) - (Number(hours.open.split(":")[0]) * 60 + Number(hours.open.split(":")[1])))
        : 0;

      return {
        staffId: staff.id,
        staffName: staff.displayName,
        bookedMinutes: Math.round(bookedMinutes),
        availableMinutes,
        utilizationPct: availableMinutes > 0 ? Math.round((bookedMinutes / availableMinutes) * 100) : 0,
      };
    });
}

export type EmptySlotsResult = { staffId: string; staffName: string; slots: { start: string; end: string }[] };

/**
 * Reuses `generateDaySlots` per staff member for a given day/branch, using
 * a nominal 30-minute probe duration (empty-slot discovery, not a specific
 * service booking) — consistent with how the public booking widget derives
 * candidate times.
 */
export async function getEmptySlots(
  repo: SalonRepository,
  organizationId: string,
  branchId: string,
  day: Date = new Date(),
  probeDurationMin = 30
): Promise<EmptySlotsResult[]> {
  const [staffResult, branchesResult, appointmentsResult] = await Promise.all([
    repo.listStaff(organizationId),
    repo.listBranches(organizationId),
    repo.listAppointments(organizationId, { branchId }),
  ]);
  if (!staffResult.ok || !branchesResult.ok || !appointmentsResult.ok) return [];

  const branch = branchesResult.data.find((b: SalonBranch) => b.id === branchId);
  if (!branch) return [];

  const dayStart = startOfDayUtc(day);
  const results: EmptySlotsResult[] = [];
  for (const staff of staffResult.data.filter((s: SalonStaff) => s.isActive && s.branchId === branchId)) {
    const busy = appointmentsResult.data
      .filter((a) => a.staffId === staff.id && a.status !== "cancelled" && a.status !== "no_show")
      .map((a) => ({ start: a.startsAt, end: a.endsAt }));
    const slots = generateDaySlots({
      dayStartUtc: dayStart,
      workingHours: branch.workingHours,
      staffWorkingHours: staff.workingHours,
      serviceDurationMin: probeDurationMin,
      stepMin: 30,
      busy,
      now: new Date(),
    });
    results.push({ staffId: staff.id, staffName: staff.displayName, slots });
  }
  return results;
}

export type RevenueSummary = { from: string; to: string; totalRevenue: number; saleCount: number; currency: string };

export async function getRevenueSummary(
  repo: SalonRepository,
  organizationId: string,
  from: Date,
  to: Date
): Promise<RevenueSummary> {
  const result = await repo.listSales(organizationId, { status: "paid" });
  const sales = result.ok
    ? result.data.filter((s) => {
        const createdAt = s.updatedAt ?? s.createdAt;
        if (!createdAt) return false;
        const ms = new Date(createdAt).getTime();
        return ms >= from.getTime() && ms <= to.getTime();
      })
    : [];
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    saleCount: sales.length,
    currency: sales[0]?.currency ?? "INR",
  };
}

export type ServicePerformance = { serviceId: string; bookingCount: number };

export async function getServicePerformance(repo: SalonRepository, organizationId: string): Promise<ServicePerformance[]> {
  const result = await repo.listAllAppointmentServices(organizationId);
  if (!result.ok) return [];
  const counts = new Map<string, number>();
  for (const svc of result.data) counts.set(svc.serviceId, (counts.get(svc.serviceId) ?? 0) + 1);
  return [...counts.entries()].map(([serviceId, bookingCount]) => ({ serviceId, bookingCount })).sort((a, b) => b.bookingCount - a.bookingCount);
}

export type PendingPaymentsSummary = { count: number; totalOutstanding: number; currency: string };

export async function getPendingPaymentsSummary(repo: SalonRepository, organizationId: string): Promise<PendingPaymentsSummary> {
  const result = await repo.listPendingPayments(organizationId);
  const sales = result.ok ? result.data : [];
  return {
    count: sales.length,
    totalOutstanding: sales.reduce((sum, s) => sum + s.total, 0),
    currency: sales[0]?.currency ?? "INR",
  };
}

export async function getCustomerCommunicationPreferences(
  repo: SalonRepository,
  customerId: string
): Promise<{ preferredChannel: string; optedOut: boolean } | null> {
  const result = await repo.getCustomer(customerId);
  if (!result.ok) return null;
  return { preferredChannel: result.data.preferredChannel, optedOut: Boolean(result.data.optedOutAt) };
}

export type BusinessSummary = {
  todayAppointments: TodayAppointmentsResult;
  pendingPayments: PendingPaymentsSummary;
  reactivationCandidateCount: number;
  unconfirmedBookingCount: number;
  attentionItems: AttentionItem[];
};

/**
 * The single "what needs attention now?" implementation, consumed by both
 * `/dashboard` and RINPO's `get_salon_business_summary` tool.
 */
export async function getBusinessSummary(
  repo: SalonRepository,
  organizationId: string,
  reactivationDaysInactive = 45
): Promise<BusinessSummary> {
  const [todayAppointments, pendingPayments, reactivationResult, emptySlotsToday] = await Promise.all([
    getTodayAppointments(repo, organizationId),
    getPendingPaymentsSummary(repo, organizationId),
    repo.getReactivationCandidates(organizationId, reactivationDaysInactive),
    (async () => {
      const branches = await repo.listBranches(organizationId);
      if (!branches.ok || !branches.data.length) return 0;
      let total = 0;
      for (const branch of branches.data) {
        const slots = await getEmptySlots(repo, organizationId, branch.id);
        total += slots.reduce((sum, s) => sum + s.slots.length, 0);
      }
      return total;
    })(),
  ]);

  const unconfirmedBookingCount = todayAppointments.byStatus.pending ?? 0;
  const reactivationCandidateCount = reactivationResult.ok ? reactivationResult.data.length : 0;

  const attentionItems = computeAttentionItems([
    { kind: "pending_payments", count: pendingPayments.count },
    { kind: "unconfirmed_bookings", count: unconfirmedBookingCount },
    { kind: "reactivation_candidates", count: reactivationCandidateCount },
    { kind: "empty_slots_today", count: emptySlotsToday },
  ]);

  return { todayAppointments, pendingPayments, reactivationCandidateCount, unconfirmedBookingCount, attentionItems };
}

// ---------------------------------------------------------------------------
// Growth intelligence (R GLOW Phase E, Slice 1) — retention, campaign
// performance, message failures, and a growth-opportunity ranking. Every
// function here is the same "thin, honest aggregation" contract as the
// rest of this file: no data means an empty/zero result, never a
// fabricated number.
// ---------------------------------------------------------------------------

export type RetentionSummary = {
  /** Customers with at least one non-cancelled visit ever. */
  totalCustomersWithVisits: number;
  /** Of those, customers with 2+ non-cancelled visits. */
  repeatCustomers: number;
  repeatRatePct: number;
};

export async function getRetentionSummary(repo: SalonRepository, organizationId: string): Promise<RetentionSummary> {
  const appointmentsResult = await repo.listAppointments(organizationId);
  const appointments = appointmentsResult.ok ? appointmentsResult.data.filter((a) => a.status !== "cancelled") : [];

  const visitsByCustomer = new Map<string, number>();
  for (const appt of appointments) {
    visitsByCustomer.set(appt.customerId, (visitsByCustomer.get(appt.customerId) ?? 0) + 1);
  }

  const totalCustomersWithVisits = visitsByCustomer.size;
  const repeatCustomers = [...visitsByCustomer.values()].filter((count) => count >= 2).length;
  const repeatRatePct = totalCustomersWithVisits > 0 ? Math.round((repeatCustomers / totalCustomersWithVisits) * 100) : 0;

  return { totalCustomersWithVisits, repeatCustomers, repeatRatePct };
}

export type CampaignPerformanceSummary = {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  estimatedAudience: number;
  attemptedCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  convertedCount: number;
  conversionRatePct: number;
};

export async function getCampaignPerformance(
  campaignsRepo: SalonCampaignsRepository,
  organizationId: string,
  limit = 10
): Promise<CampaignPerformanceSummary[]> {
  const result = await campaignsRepo.listCampaigns(organizationId);
  if (!result.ok) return [];
  return result.data.slice(0, limit).map((c) => ({
    campaignId: c.id,
    name: c.name,
    status: c.status,
    estimatedAudience: c.estimatedAudience,
    attemptedCount: c.attemptedCount,
    sentCount: c.sentCount,
    deliveredCount: c.deliveredCount,
    failedCount: c.failedCount,
    convertedCount: c.convertedCount,
    conversionRatePct: c.attemptedCount > 0 ? Math.round((c.convertedCount / c.attemptedCount) * 100) : 0,
  }));
}

export type MessageFailuresSummary = {
  failedCount: number;
  deadLetterCount: number;
  notConfiguredCount: number;
};

export async function getMessageFailuresSummary(client: SalonSupabaseClient, organizationId: string): Promise<MessageFailuresSummary> {
  const { data, error } = await client
    .from("notification_outbox")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["failed", "dead_letter", "not_configured"]);
  if (error || !data) return { failedCount: 0, deadLetterCount: 0, notConfiguredCount: 0 };
  const rows = data as SalonRow[];
  return {
    failedCount: rows.filter((r) => r.status === "failed").length,
    deadLetterCount: rows.filter((r) => r.status === "dead_letter").length,
    notConfiguredCount: rows.filter((r) => r.status === "not_configured").length,
  };
}

/**
 * The growth-specific counterpart to `getBusinessSummary`'s attention
 * ranking — same `computeAttentionItems` implementation, new signal kinds
 * (`message_failures`, `pending_campaign_approvals`, `low_repeat_rate`).
 */
export async function getGrowthOpportunities(
  repo: SalonRepository,
  campaignsRepo: SalonCampaignsRepository,
  client: SalonSupabaseClient,
  organizationId: string
): Promise<AttentionItem[]> {
  const [retention, failures, draftCampaignsResult] = await Promise.all([
    getRetentionSummary(repo, organizationId),
    getMessageFailuresSummary(client, organizationId),
    campaignsRepo.listCampaigns(organizationId, { status: "draft" }),
  ]);

  const pendingApprovals = draftCampaignsResult.ok ? draftCampaignsResult.data.length : 0;
  const nonReturningPct = retention.totalCustomersWithVisits > 0 ? 100 - retention.repeatRatePct : 0;

  return computeAttentionItems([
    { kind: "message_failures", count: failures.failedCount + failures.deadLetterCount },
    { kind: "pending_campaign_approvals", count: pendingApprovals },
    {
      kind: "low_repeat_rate",
      count: nonReturningPct,
      detail: { repeatRatePct: retention.repeatRatePct, totalCustomersWithVisits: retention.totalCustomersWithVisits },
    },
  ]);
}
