import { isPrivilegedRoleKey, type RoleKey } from "@rinads/permissions";

/**
 * Company OS permission keys. These extend the keys seeded by the Company OS v1 kernel (founder.read, clients.*, sales.*, work.*, finance.read, people.*, approvals.decide) and are additive to the CORE/commerce keys.
 *
 * Source of truth for enforcement is the database (RLS via `private.has_permission`).
 * This module mirrors the grants so the UI can hide what a role cannot use and so a
 * static test can prove the SQL seed and this table never drift
 * (`apps/website/tests/company-os-migrations.test.ts`).
 */
export const COMPANY_OS_PERMISSIONS = [
  "founder.read",
  "clients.read",
  "clients.write",
  "sales.read",
  "sales.write",
  "work.read",
  "work.write",
  "finance.read",
  "finance.write",
  "people.read",
  "people.write",
  "studio.read",
  "studio.manage",
  "growth.read",
  "growth.manage",
  "engineering.read",
  "ai.read",
  "ai.manage",
  "comms.read",
  "comms.manage",
  "academy.read",
  "academy.manage",
  "reports.read",
  "approvals.read",
  "approvals.decide",
] as const;

export type CompanyOsPermission = (typeof COMPANY_OS_PERMISSIONS)[number];

export const COMPANY_OS_PERMISSION_DESCRIPTIONS: Record<CompanyOsPermission, string> = {
  "founder.read": "View the Founder Control Tower",
  "clients.read": "Read companies, contacts and contracts",
  "clients.write": "Create and update companies, contacts and contracts",
  "sales.read": "Read leads, opportunities and proposals",
  "sales.write": "Create and update leads, opportunities and proposals",
  "work.read": "Read projects, milestones, tasks and deliverables",
  "work.write": "Create and manage projects, milestones, tasks, deliverables and allocation",
  "finance.read": "Read invoices, payments, expenses and receivables",
  "finance.write": "Issue invoices and record payments (approval-gated)",
  "people.read": "Read team skills and capacity",
  "people.write": "Manage team skills and capacity",
  "studio.read": "Read Studio jobs and creative assets",
  "studio.manage": "Run Studio production and register creative assets",
  "growth.read": "Read campaigns, content and ads performance",
  "growth.manage": "Manage campaigns, content and ads (publishing is approval-gated)",
  "engineering.read": "Read engineering and deployment health",
  "ai.read": "Read AI provider, run and cost visibility",
  "ai.manage": "Manage AI role profiles",
  "comms.read": "Read communication activity",
  "comms.manage": "Record and link communication activity",
  "academy.read": "Read Academy skills and progress",
  "academy.manage": "Manage Academy skills and record progress evidence",
  "reports.read": "Read computed company reports",
  "approvals.read": "Read the approvals queue",
  "approvals.decide": "Approve or reject governed actions",
};

const ALL: readonly CompanyOsPermission[] = COMPANY_OS_PERMISSIONS;

/** Role → Company OS permissions. `founder` / `super_admin` receive everything. */
export const ROLE_PERMISSION_GRANTS: Record<RoleKey, readonly CompanyOsPermission[]> = {
  founder: ALL,
  super_admin: ALL,
  admin: ALL,
  manager: [
    "clients.read",
    "clients.write",
    "sales.read",
    "sales.write",
    "work.read",
    "work.write",
    "finance.read",
    "people.read",
    "people.write",
    "studio.read",
    "studio.manage",
    "growth.read",
    "growth.manage",
    "engineering.read",
    "ai.read",
    "comms.read",
    "comms.manage",
    "academy.read",
    "academy.manage",
    "reports.read",
    "approvals.read",
    "approvals.decide",
  ],
  staff: [
    "clients.read",
    "sales.read",
    "work.read",
    "studio.read",
    "growth.read",
    "comms.read",
    "academy.read",
    "approvals.read",
  ],
  client: [],
  viewer: [],
};

/**
 * Returns true when the member may use `permission`.
 * Privileged system roles pass every Company OS permission (they hold all keys in the DB too).
 */
export function can(
  member: { roleKey: string | null; permissions: readonly string[] },
  permission: CompanyOsPermission | (string & {})
): boolean {
  if (member.roleKey && isPrivilegedRoleKey(member.roleKey)) return true;
  return member.permissions.includes(permission);
}

export function canAny(
  member: { roleKey: string | null; permissions: readonly string[] },
  permissions: readonly string[]
): boolean {
  return permissions.some((permission) => can(member, permission));
}
