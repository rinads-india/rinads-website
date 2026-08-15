import type { CommerceContext } from "@rinads/commerce";
import type { OperationsContext } from "@rinads/operations";
import type { PermissionKey } from "@rinads/permissions";
import { decideAccess } from "@rinads/permissions";
import type { AccessDecision } from "@rinads/permissions";
import type { TenancyContext, TenancyLoadInput } from "./types";

export function buildTenancyContext(input: TenancyLoadInput): TenancyContext | null {
  if (!input.memberships.length) return null;

  const active =
    input.memberships.find((m) => m.organizationId === input.activeOrganizationId) ??
    input.memberships.find((m) => m.organizationStatus === "active") ??
    input.memberships[0];

  if (!active) return null;

  return {
    userId: input.userId,
    email: input.email,
    organizationId: active.organizationId,
    organizationSlug: active.organizationSlug,
    organizationStatus: active.organizationStatus,
    roleKey: active.roleKey,
    permissions: active.permissions,
    memberships: input.memberships,
    requestId: input.requestId,
    planKey: input.planKey,
    verticalKey: input.verticalKey,
    featureFlags: input.featureFlags ?? {},
  };
}

export function toCommerceContext(tenancy: TenancyContext, customerId?: string): CommerceContext {
  return {
    organizationId: tenancy.organizationId,
    userId: tenancy.userId,
    customerId,
    requestId: tenancy.requestId ?? `req_${Date.now()}`,
  };
}

export function toOperationsContext(tenancy: TenancyContext): OperationsContext {
  return {
    organizationId: tenancy.organizationId,
    userId: tenancy.userId,
    requestId: tenancy.requestId ?? `req_${Date.now()}`,
    roleKey: tenancy.roleKey,
  };
}

export function requireOrgActive(tenancy: TenancyContext): AccessDecision {
  if (tenancy.organizationStatus === "suspended") {
    return decideAccess(false, "Organization is suspended.");
  }
  if (tenancy.organizationStatus === "archived") {
    return decideAccess(false, "Organization is archived.");
  }
  return decideAccess(true, "");
}

export function requirePermission(tenancy: TenancyContext, permission: PermissionKey): AccessDecision {
  const active = requireOrgActive(tenancy);
  if (!active.allowed) return active;
  if (!tenancy.permissions.includes(permission)) {
    return decideAccess(false, `Missing permission: ${permission}`);
  }
  return decideAccess(true, "");
}

export function requirePrivilegedRole(tenancy: TenancyContext): AccessDecision {
  if (tenancy.roleKey !== "founder" && tenancy.roleKey !== "super_admin") {
    return decideAccess(false, "Platform privileges required.");
  }
  return decideAccess(true, "");
}

export function isFeatureEnabled(tenancy: TenancyContext, flagKey: string): boolean {
  return tenancy.featureFlags[flagKey] ?? false;
}

export function assertTenancy(tenancy: TenancyContext | null): TenancyContext {
  if (!tenancy) throw new Error("Not authenticated or no organization membership.");
  return tenancy;
}
