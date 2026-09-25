import type { OrgMembership } from "@rinads/tenancy";
import type { RoleKey } from "@rinads/permissions";
import type { WorkspaceStatusData } from "@/lib/os-home/types";
import { capabilityTierFromRoleKey } from "@/lib/os-org-role";

export function loadLiveWorkspaceStatus(input: {
  memberships: OrgMembership[];
  organizationId: string | null;
  roleKey: RoleKey | null;
}): WorkspaceStatusData {
  const active = input.organizationId
    ? input.memberships.find((m) => m.organizationId === input.organizationId)
    : input.memberships[0];

  const tier = capabilityTierFromRoleKey(input.roleKey ?? active?.roleKey ?? null);
  const roleLabel = input.roleKey ?? active?.roleKey ?? null;

  return {
    mode: "live",
    organizationName: active?.organizationName ?? null,
    organizationStatus: active?.organizationStatus ?? null,
    roleLabel,
    headline: active?.organizationName ?? "Organisation workspace",
    detail: [
      active?.organizationStatus ? `Status: ${active.organizationStatus}` : null,
      roleLabel ? `Role: ${roleLabel}` : tier ? `Access: ${tier}` : "Role unresolved",
    ]
      .filter(Boolean)
      .join(" · "),
  };
}
