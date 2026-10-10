import type { ConnectionState, SourceCheck } from "@/lib/founder-intelligence/types";

export type RinpoMetricId =
  | "conversations"
  | "memory"
  | "pending_actions"
  | "pending_approvals"
  | "audit_events"
  | "training_jobs";

export type RinpoMetric = {
  id: RinpoMetricId;
  label: string;
  value: number | null;
  state: ConnectionState;
  detail: string;
};

export type RinpoProviderId = "openai" | "xai" | "custom";

export type RinpoProviderRouteStatus = {
  provider: RinpoProviderId;
  model: string;
  baseUrl: string;
  configured: boolean;
  selectedByDefault: boolean;
};

export type RinpoControlSnapshot = {
  checkedAt: string;
  runtime: SourceCheck;
  intelligenceBackend: SourceCheck;
  metrics: RinpoMetric[];
  providerRoutes: RinpoProviderRouteStatus[];
  dataPlaneState: ConnectionState;
  dataPlaneDetail: string;
};
