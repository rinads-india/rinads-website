import type { PermissionKey, RoleKey } from "@rinads/permissions";

export type OrgMembership = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationStatus: "active" | "suspended" | "archived";
  roleKey: RoleKey;
  roleId: string;
  permissions: PermissionKey[];
};

export type TenancyContext = {
  userId: string;
  email?: string;
  organizationId: string;
  organizationSlug: string;
  organizationStatus: "active" | "suspended" | "archived";
  roleKey: RoleKey;
  permissions: PermissionKey[];
  memberships: OrgMembership[];
  requestId?: string;
  planKey?: string;
  verticalKey?: string;
  featureFlags: Record<string, boolean>;
};

export type TenancyLoadInput = {
  userId: string;
  email?: string;
  activeOrganizationId?: string;
  memberships: OrgMembership[];
  planKey?: string;
  verticalKey?: string;
  featureFlags?: Record<string, boolean>;
  requestId?: string;
};

export const ACTIVE_ORG_COOKIE = "rinads_active_org";
