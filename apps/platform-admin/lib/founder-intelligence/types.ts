export type ConnectionState =
  | "operational"
  | "degraded"
  | "unavailable"
  | "not_connected";

export type SourceCheck = {
  id: string;
  label: string;
  state: ConnectionState;
  detail: string;
  checkedAt: string | null;
  href?: string;
};

export type StatusSource = {
  id: string;
  label: string;
  check(): Promise<SourceCheck>;
};

export type FounderWorkspace = {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  slug: string;
  kind: string;
  status: string;
  isDefault: boolean;
  locationCount: number;
};

export type WorkspaceResult =
  | { state: "operational"; workspaces: FounderWorkspace[]; checkedAt: string }
  | {
      state: "degraded" | "unavailable" | "not_connected";
      workspaces: [];
      checkedAt: string | null;
      detail: string;
    };

export type FounderIntelligenceSnapshot = {
  checkedAt: string;
  sources: SourceCheck[];
  workspaceResult: WorkspaceResult;
};
