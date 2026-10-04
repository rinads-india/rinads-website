export type WorkspaceKind =
  | "default"
  | "business_unit"
  | "brand"
  | "department"
  | "channel"
  | "project"
  | "other";

export type WorkspaceStatus = "active" | "archived";

export type WorkspaceScope = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  kind: WorkspaceKind;
  isDefault: boolean;
  status: WorkspaceStatus;
};

export type LocationKind =
  | "physical"
  | "branch"
  | "office"
  | "warehouse"
  | "showroom"
  | "service_area"
  | "virtual"
  | "other";

export type LocationStatus = "active" | "archived";

export type PlatformLocationScope = {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  code: string;
  kind: LocationKind;
  status: LocationStatus;
};

export function workspaceBelongsToOrganization(
  workspace: Pick<WorkspaceScope, "organizationId">,
  organizationId: string,
): boolean {
  return workspace.organizationId === organizationId;
}

export function locationBelongsToScope(
  location: Pick<PlatformLocationScope, "organizationId" | "workspaceId">,
  scope: { organizationId: string; workspaceId?: string },
): boolean {
  if (location.organizationId !== scope.organizationId) return false;
  if (scope.workspaceId && location.workspaceId !== scope.workspaceId) return false;
  return true;
}

export function assertWorkspaceScope(
  workspace: Pick<WorkspaceScope, "organizationId">,
  organizationId: string,
): void {
  if (!workspaceBelongsToOrganization(workspace, organizationId)) {
    throw new Error("Workspace tenant scope mismatch");
  }
}

export function assertLocationScope(
  location: Pick<PlatformLocationScope, "organizationId" | "workspaceId">,
  scope: { organizationId: string; workspaceId?: string },
): void {
  if (!locationBelongsToScope(location, scope)) {
    throw new Error("Location tenant scope mismatch");
  }
}
