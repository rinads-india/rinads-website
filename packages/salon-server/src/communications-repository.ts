import { fail, ok, type Result } from "@rinads/salon";
import type { SalonQueryBuilder, SalonRow, SalonSupabaseClient } from "./client";

export const RETRYABLE_COMMUNICATION_STATUSES = ["failed", "dead_letter", "not_configured"] as const;

export type CommunicationStatus =
  | "pending"
  | "processing"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "not_configured"
  | "dead_letter"
  | "cancelled";

export type SalonCommunication = {
  id: string;
  organizationId: string;
  channel: string;
  templateKey: string;
  recipient: string;
  payload: Record<string, unknown>;
  status: CommunicationStatus;
  attempts: number;
  lastError?: string;
  provider?: string;
  providerMessageId?: string;
  nextAttemptAt?: string;
  campaignRecipientId?: string;
  createdAt: string;
  updatedAt?: string;
};

export type SalonDeliveryEvent = {
  id: string;
  outboxId: string;
  provider: string;
  providerMessageId: string;
  providerStatus: string;
  rawPayload: Record<string, unknown>;
  createdAt: string;
};

export type CommunicationsListInput = {
  page?: number;
  pageSize?: number;
  statuses?: CommunicationStatus[];
  channel?: string;
  from?: string;
  to?: string;
};

export type CommunicationsPage = {
  rows: SalonCommunication[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type CommunicationsFunnel = {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  notConfigured: number;
  deadLetter: number;
  deliveryRatePct: number;
  failureRatePct: number;
};

export type RetryCommunicationsResult = {
  rows: Array<{ id: string; status: "pending"; attempts: number }>;
  count: number;
  hasMore: boolean;
  limit: number;
};

function mapCommunication(row: SalonRow): SalonCommunication {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    channel: String(row.channel),
    templateKey: String(row.template_key),
    recipient: String(row.recipient),
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: String(row.status) as CommunicationStatus,
    attempts: Number(row.attempts ?? 0),
    lastError: row.last_error ? String(row.last_error) : undefined,
    provider: row.provider ? String(row.provider) : undefined,
    providerMessageId: row.provider_message_id ? String(row.provider_message_id) : undefined,
    nextAttemptAt: row.next_attempt_at ? String(row.next_attempt_at) : undefined,
    campaignRecipientId: row.campaign_recipient_id ? String(row.campaign_recipient_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class SalonCommunicationsRepository {
  constructor(private readonly client: SalonSupabaseClient) {}

  async list(organizationId: string, input: CommunicationsListInput = {}): Promise<Result<CommunicationsPage>> {
    const page = Math.max(1, Math.floor(input.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(input.pageSize ?? 25)));
    let query: SalonQueryBuilder = this.client
      .from("notification_outbox")
      .select("*")
      .eq("organization_id", organizationId);
    if (input.statuses?.length) query = query.in("status", input.statuses);
    if (input.channel) query = query.eq("channel", input.channel);
    if (input.from) query = query.gte("created_at", input.from);
    if (input.to) query = query.lte("created_at", input.to);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    const all = (data ?? []).map(mapCommunication);
    const start = (page - 1) * pageSize;
    return ok({ rows: all.slice(start, start + pageSize), page, pageSize, total: all.length, hasMore: start + pageSize < all.length });
  }

  async get(organizationId: string, outboxId: string): Promise<Result<SalonCommunication>> {
    const { data, error } = await this.client
      .from("notification_outbox")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", outboxId)
      .maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Communication not found.");
    return ok(mapCommunication(data));
  }

  async timeline(organizationId: string, outboxId: string): Promise<Result<SalonDeliveryEvent[]>> {
    const communication = await this.get(organizationId, outboxId);
    if (!communication.ok) return communication;
    const { data, error } = await this.client
      .from("notification_delivery_events")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("notification_outbox_id", outboxId)
      .order("created_at", { ascending: true });
    if (error) return fail("db_error", error.message);
    return ok(
      (data ?? []).map((row) => ({
        id: String(row.id),
        outboxId: String(row.notification_outbox_id),
        provider: String(row.provider),
        providerMessageId: String(row.provider_message_id),
        providerStatus: String(row.provider_status),
        rawPayload: (row.raw_payload as Record<string, unknown>) ?? {},
        createdAt: String(row.created_at),
      }))
    );
  }

  async details(
    organizationId: string,
    outboxId: string
  ): Promise<Result<{ communication: SalonCommunication; timeline: SalonDeliveryEvent[] }>> {
    const communication = await this.get(organizationId, outboxId);
    if (!communication.ok) return communication;
    const timeline = await this.timeline(organizationId, outboxId);
    if (!timeline.ok) return timeline;
    return ok({ communication: communication.data, timeline: timeline.data });
  }

  async funnel(organizationId: string, input: Pick<CommunicationsListInput, "from" | "to"> = {}): Promise<Result<CommunicationsFunnel>> {
    let query = this.client.from("notification_outbox").select("*").eq("organization_id", organizationId);
    if (input.from) query = query.gte("created_at", input.from);
    if (input.to) query = query.lte("created_at", input.to);
    const { data, error } = await query;
    if (error) return fail("db_error", error.message);
    // Metrics cover every matching source-of-truth row, independently of UI paging.
    const full = (data ?? []).map(mapCommunication);
    const count = (status: CommunicationStatus) => full.filter((row) => row.status === status).length;
    const total = full.length;
    const delivered = count("delivered");
    const read = count("read");
    const failed = count("failed");
    const notConfigured = count("not_configured");
    const deadLetter = count("dead_letter");
    const denominator = Math.max(1, total);
    return ok({
      total,
      queued: count("pending") + count("processing"),
      sent: count("sent"),
      delivered,
      read,
      failed,
      notConfigured,
      deadLetter,
      deliveryRatePct: Math.round(((delivered + read) / denominator) * 1000) / 10,
      failureRatePct: Math.round(((failed + notConfigured + deadLetter) / denominator) * 1000) / 10,
    });
  }

  async retryOne(organizationId: string, outboxId: string): Promise<Result<RetryCommunicationsResult>> {
    return this.retry(organizationId, { outboxId, limit: 1 });
  }

  async retryCampaign(organizationId: string, campaignId: string, limit = 50): Promise<Result<RetryCommunicationsResult>> {
    return this.retry(organizationId, { campaignId, limit });
  }

  async previewCampaignRetry(
    organizationId: string,
    campaignId: string,
    limit = 50
  ): Promise<Result<{ count: number; selected: number; hasMore: boolean }>> {
    const bounded = Math.min(100, Math.max(1, Math.floor(limit)));
    const { data: recipients, error: recipientError } = await this.client
      .from("salon_campaign_recipients")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("campaign_id", campaignId);
    if (recipientError) return fail("db_error", recipientError.message);
    const ids = (recipients ?? []).map((row) => row.id);
    if (!ids.length) return ok({ count: 0, selected: 0, hasMore: false });
    const { data, error } = await this.client
      .from("notification_outbox")
      .select("id")
      .eq("organization_id", organizationId)
      .in("campaign_recipient_id", ids)
      .in("status", [...RETRYABLE_COMMUNICATION_STATUSES]);
    if (error) return fail("db_error", error.message);
    const count = data?.length ?? 0;
    return ok({ count, selected: Math.min(count, bounded), hasMore: count > bounded });
  }

  async retry(
    organizationId: string,
    input: { outboxId?: string; campaignId?: string; limit?: number }
  ): Promise<Result<RetryCommunicationsResult>> {
    const limit = Math.min(100, Math.max(1, Math.floor(input.limit ?? 50)));
    const { data, error } = await this.client.rpc("retry_salon_notification_outbox", {
      p_organization_id: organizationId,
      p_notification_outbox_id: input.outboxId ?? null,
      p_campaign_id: input.campaignId ?? null,
      p_limit: limit,
    });
    if (error) return fail("db_error", error.message);
    const result = data as Partial<RetryCommunicationsResult> | null;
    return ok({
      rows: Array.isArray(result?.rows) ? result.rows : [],
      count: Number(result?.count ?? 0),
      hasMore: Boolean(result?.hasMore ?? (result as Record<string, unknown> | null)?.has_more),
      limit: Number(result?.limit ?? limit),
    });
  }
}
