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

export type RinpoControlSnapshot = {
  checkedAt: string;
  runtime: SourceCheck;
  intelligenceBackend: SourceCheck;
  metrics: RinpoMetric[];
  dataPlaneState: ConnectionState;
  dataPlaneDetail: string;
};
