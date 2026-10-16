export type ConnectionState =
  | "operational"
  | "degraded"
  | "unavailable"
  | "not_connected";

export type SourceCheckItem = {
  id: string;
  label: string;
  state: ConnectionState;
  detail: string;
  href?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type SourceCheck = {
  id: string;
  label: string;
  state: ConnectionState;
  detail: string;
  checkedAt: string | null;
  href?: string;
  items?: SourceCheckItem[];
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

export type FounderWorkItem = {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  status: "todo" | "in_progress" | "blocked";
  priority: "low" | "normal" | "high" | "urgent";
  dueAt: string | null;
  assigneeId: string | null;
  entityType: string | null;
  entityId: string | null;
};

export type FounderOperationalAlert = {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
};

export type WorkResult =
  | {
      state: "operational";
      checkedAt: string;
      tasks: FounderWorkItem[];
      alerts: FounderOperationalAlert[];
      counts: {
        open: number;
        blocked: number;
        overdue: number;
        dueToday: number;
        urgent: number;
        unacknowledgedAlerts: number;
      };
    }
  | {
      state: "degraded" | "unavailable" | "not_connected";
      checkedAt: string | null;
      tasks: [];
      alerts: [];
      counts: {
        open: 0;
        blocked: 0;
        overdue: 0;
        dueToday: 0;
        urgent: 0;
        unacknowledgedAlerts: 0;
      };
      detail: string;
    };

export type FounderIntelligenceSnapshot = {
  checkedAt: string;
  sources: SourceCheck[];
  workspaceResult: WorkspaceResult;
  workResult: WorkResult;
};
