import { isPrivilegedRoleKey, type RoleKey } from "@rinads/permissions";

/**
 * Company OS permission keys. These are *additive* to the CORE/commerce keys.
 *
 * Source of truth for enforcement is the database (RLS via `private.has_permission`).
 * This module mirrors the grants so the UI can hide what a role cannot use and so a
 * static test can prove the SQL seed and this table never drift
 * (`apps/website/tests/company-os-migrations.test.ts`).
 */
export const COMPANY_OS_PERMISSIONS = [
  "company.founder.view",
  "crm.read",
  "crm.manage",
  "projects.read",
  "projects.manage",
  "finance.read",
  "finance.manage",
  "people.read",
  "people.manage",
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
  "company.founder.view": "View the Founder Control Tower",
  "crm.read": "Read leads, companies, contacts, opportunities, proposals and contracts",
  "crm.manage": "Create and update CRM and sales objects",
  "projects.read": "Read projects, milestones and deliverables",
  "projects.manage": "Create and manage projects, milestones, deliverables and task allocation",
  "finance.read": "Read invoices, payments and receivables",
  "finance.manage": "Issue invoices and record payments (approval-gated)",
  "people.read": "Read team skills and capacity",
  "people.manage": "Manage team skills and capacity",
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
    "crm.read",
    "crm.manage",
    "projects.read",
    "projects.manage",
    "finance.read",
    "people.read",
    "people.manage",
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
    "crm.read",
    "projects.read",
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
