import type { RoleKey } from "@rinads/permissions";
import type { OrgMembership } from "@rinads/tenancy";

export type RinpoPhoneHomeApp = {
  id: "today" | "rinpo" | "work" | "customers" | "money" | "growth" | "approvals" | "world" | "apps" | "settings";
  label: string;
  route: string;
  placement: "dock" | "library";
};

export type RinpoPhoneWorkspace = {
  id: string;
  name: string;
  type: "personal" | "organisation";
  roleKey: RoleKey | "personal";
  active: boolean;
};

export type RinpoPhoneHomePayload = {
  authenticated: boolean;
  user: {
    id: string;
    displayName: string;
  };
  workspace: RinpoPhoneWorkspace;
  workspaces: RinpoPhoneWorkspace[];
  apps: RinpoPhoneHomeApp[];
  dock: RinpoPhoneHomeApp["id"][];
  security: {
    visibilityOnly: true;
    authorization: "server-and-rls";
  };
};

const OWNER_STAFF_ROLES: readonly RoleKey[] = ["founder", "super_admin", "admin", "manager", "staff"];
const APPROVER_ROLES: readonly RoleKey[] = ["founder", "super_admin", "admin", "manager"];
const ADMIN_ROLES: readonly RoleKey[] = ["founder", "super_admin", "admin"];

function hasRole(role: RoleKey, roles: readonly RoleKey[]) {
  return roles.includes(role);
}

function hasPermission(membership: OrgMembership, permission: string) {
  return membership.permissions.some((candidate) => candidate === permission);
}

function hasPermissionPrefix(membership: OrgMembership, prefix: string) {
  return membership.permissions.some((candidate) => candidate.startsWith(prefix));
}

function displayNameFallback(displayName: string | null | undefined, email: string | null | undefined) {
  const name = displayName?.trim();
  if (name) return name;
  const emailLocalPart = email?.split("@")[0]?.trim();
  return emailLocalPart || "RINADS user";
}

function organisationApps(membership: OrgMembership): RinpoPhoneHomeApp[] {
  const apps: RinpoPhoneHomeApp[] = [];

  if (hasRole(membership.roleKey, OWNER_STAFF_ROLES) || hasPermission(membership, "tasks.manage")) {
    apps.push({ id: "work", label: "Work", route: "rinpo://work", placement: "dock" });
  }

  if (hasRole(membership.roleKey, OWNER_STAFF_ROLES) || hasPermissionPrefix(membership, "crm.")) {
    apps.push({ id: "customers", label: "Customers", route: "rinpo://customers", placement: "library" });
  }

  if (
    hasRole(membership.roleKey, APPROVER_ROLES) ||
    hasPermission(membership, "commerce.order.read") ||
    hasPermissionPrefix(membership, "finance.")
  ) {
    apps.push({ id: "money", label: "Money", route: "rinpo://money", placement: "library" });
  }

  if (
    hasRole(membership.roleKey, OWNER_STAFF_ROLES) ||
    hasPermission(membership, "salon.campaigns.manage") ||
    hasPermissionPrefix(membership, "growth.")
  ) {
    apps.push({ id: "growth", label: "Growth", route: "rinpo://growth", placement: "library" });
  }

  if (hasRole(membership.roleKey, APPROVER_ROLES)) {
    apps.push({ id: "approvals", label: "Approvals", route: "rinpo://approvals", placement: "library" });
  }

  if (hasRole(membership.roleKey, ADMIN_ROLES)) {
    apps.push({ id: "settings", label: "Settings", route: "rinpo://settings", placement: "library" });
  }

  return apps;
}

export function resolveRinpoPhoneHome(input: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  memberships: OrgMembership[];
  activeOrganizationId?: string | null;
}): RinpoPhoneHomePayload {
  const activeMemberships = input.memberships.filter((membership) => membership.organizationStatus === "active");
  const selectedMembership =
    activeMemberships.find((membership) => membership.organizationId === input.activeOrganizationId) ??
    activeMemberships[0] ??
    null;

  const personalWorkspace: RinpoPhoneWorkspace = {
    id: `personal:${input.userId}`,
    name: "Personal",
    type: "personal",
    roleKey: "personal",
    active: !selectedMembership,
  };

  const organisationWorkspaces = activeMemberships.map<RinpoPhoneWorkspace>((membership) => ({
    id: membership.organizationId,
    name: membership.organizationName,
    type: "organisation",
    roleKey: membership.roleKey,
    active: membership.organizationId === selectedMembership?.organizationId,
  }));

  const baseApps: RinpoPhoneHomeApp[] = [
    { id: "today", label: "Today", route: "rinpo://today", placement: "dock" },
    { id: "rinpo", label: "RINPO", route: "rinpo://ask", placement: "dock" },
    { id: "world", label: "World", route: "rinpo://world", placement: "dock" },
    { id: "apps", label: "Apps", route: "rinpo://apps", placement: "dock" },
  ];

  const apps = selectedMembership
    ? [...baseApps, ...organisationApps(selectedMembership)]
    : baseApps;

  const dockOrder: RinpoPhoneHomeApp["id"][] = ["today", "rinpo", "work", "world", "apps"];
  const availableIds = new Set(apps.map((app) => app.id));
  const dock = dockOrder.filter((id) => availableIds.has(id));

  const activeWorkspace = selectedMembership
    ? organisationWorkspaces.find((workspace) => workspace.id === selectedMembership.organizationId)!
    : personalWorkspace;

  return {
    authenticated: true,
    user: {
      id: input.userId,
      displayName: displayNameFallback(input.displayName, input.email),
    },
    workspace: activeWorkspace,
    workspaces: [personalWorkspace, ...organisationWorkspaces],
    apps,
    dock,
    security: {
      visibilityOnly: true,
      authorization: "server-and-rls",
    },
  };
}
