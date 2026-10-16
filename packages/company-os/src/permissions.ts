import type { PermissionKey } from "@rinads/permissions";

/** Company OS permission keys (seeded in migration). */
export const COMPANY_OS_PERMISSION_KEYS = [
  "founder.read",
  "founder.decide",
  "clients.read",
  "clients.write",
  "sales.read",
  "sales.write",
  "work.read",
  "work.write",
  "finance.read",
  "people.read",
  "people.write",
  "approvals.decide",
  "ai.agent.execute",
] as const satisfies readonly PermissionKey[];

export type CompanyOsPermissionKey = (typeof COMPANY_OS_PERMISSION_KEYS)[number];

/** High-risk permissions — never implied by generic admin alone in product policy. */
export const COMPANY_OS_HIGH_RISK_PERMISSIONS = [
  "approvals.decide",
  "founder.decide",
  "ai.agent.execute",
] as const satisfies readonly CompanyOsPermissionKey[];
