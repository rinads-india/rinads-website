import { isOwnerStaffRoleKey } from "@rinads/permissions";

/**
 * RINPO Phone Today: minimal evidence-backed, read-only Business OS summary.
 * Counts are never inferred from demo data or defaulted to zero on query errors.
 */
export const RINPO_TODAY_OPEN_TASK_STATUSES = [
  "todo",
  "in_progress",
  "waiting",
  "review",
] as const;

export type RinpoTodayCountResponse = {
  count: number | null;
  error: { message: string } | null;
};

export type RinpoTodayResult =
  | {
      status: "ready";
      source: "live";
      customerCount: number;
      openTaskCount: number;
    }
  | {
      status: "no_organization" | "restricted" | "unavailable";
      source: "none";
    };

export function canReadRinpoToday(input: {
  organizationId: string | null;
  roleKey: string | null;
  permissions: readonly string[];
}): boolean {
  return Boolean(
    input.organizationId &&
      isOwnerStaffRoleKey(input.roleKey ?? "") &&
      (input.permissions.includes("org.read") || input.permissions.includes("org.manage")),
  );
}

function verifiedCount(response: RinpoTodayCountResponse): number | null {
  if (response.error || response.count === null) return null;
  if (!Number.isSafeInteger(response.count) || response.count < 0) return null;
  return response.count;
}

export function buildRinpoTodayFromCounts(
  customers: RinpoTodayCountResponse,
  tasks: RinpoTodayCountResponse,
): RinpoTodayResult {
  const customerCount = verifiedCount(customers);
  const openTaskCount = verifiedCount(tasks);
  // Fail closed: never turn a failed query into a fabricated zero or demo number.
  if (customerCount === null || openTaskCount === null) {
    return { status: "unavailable", source: "none" };
  }
  return { status: "ready", source: "live", customerCount, openTaskCount };
}
