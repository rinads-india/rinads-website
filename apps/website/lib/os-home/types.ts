export type DataSource = "live" | "demo";

export type AttentionItemType =
  | "task_due"
  | "alert"
  | "approval"
  | "order_attention"
  | "lead_followup"
  | "invoice_overdue"
  | "project_risk";

export type AttentionItem = {
  id: string;
  type: AttentionItemType;
  label: string;
  count: number;
  href: string;
  severity?: "neutral" | "attention" | "critical";
  source: DataSource;
};

export type RinpoRecommendationKind = "recommendation" | "prepared_action" | "approval_required" | "executed";

export type RinpoRecommendation = {
  id: string;
  text: string;
  kind: RinpoRecommendationKind;
  href?: string;
  source: DataSource;
};

export type RinpoDailyBriefData = {
  summary: string;
  attentionCount: number;
  recommendations: RinpoRecommendation[];
  source: DataSource;
};

export type PulseMetric = {
  id: string;
  label: string;
  value: string;
  timeframe: string;
  source: DataSource;
  comparison?: string;
  href?: string;
};

export type RecentEntityType = "task" | "order" | "project" | "room" | "workspace";

export type RecentEntity = {
  id: string;
  name: string;
  entityType: RecentEntityType;
  entityTypeLabel: string;
  subtitle: string;
  href: string;
  source: DataSource;
};

export type RoomSummary = {
  id: string;
  name: string;
  description: string;
  participantCount?: number;
  unreadCount?: number;
  live: boolean;
  liveLabel?: string;
  href: string;
  source: DataSource;
};

export type WorkspaceStatusData = {
  mode: "live" | "demo";
  organizationName: string | null;
  organizationStatus: string | null;
  roleLabel: string | null;
  headline: string;
  detail: string;
};

export type OsHomeData = {
  workspace: WorkspaceStatusData;
  attention: AttentionItem[];
  brief: RinpoDailyBriefData;
  pulse: PulseMetric[];
  continueWorking: RecentEntity[];
  rooms: RoomSummary[];
  /** True when live loaders ran (even if sections are empty). */
  liveAttempted: boolean;
  errors: Partial<Record<"attention" | "pulse" | "continueWorking" | "rooms", string>>;
};
