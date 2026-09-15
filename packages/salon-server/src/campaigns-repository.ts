/**
 * Segment + campaign lifecycle (R GLOW Phase E, Slice 1):
 * Segment -> Draft campaign -> Audience preview -> Approve -> Send.
 *
 * Like `SalonRepository`, this talks directly to Supabase — RLS is the
 * single source of authorization truth (draft/edit needs
 * `salon.campaigns.manage`; approve/send/cancel needs `org.manage`, see
 * the migration's dual-UPDATE-policy note). `sendCampaign` **re-validates**
 * the audience at send time using the exact same `evaluateSegment` call
 * `previewAudience` uses — a customer who opted out (or otherwise stopped
 * matching) between preview and send is never messaged just because an
 * earlier preview said they were eligible.
 */
import {
  canTransitionCampaignStatus,
  fail,
  ok,
  type CampaignStatus,
  type CampaignType,
  type CampaignChannel,
  type Result,
  type SalonCampaign,
  type SalonCampaignRecipient,
  type SalonSegment,
  type SegmentCriteria,
} from "@rinads/salon";
import type { SalonSupabaseClient } from "./client";
import { mapCampaignRecipientRow, mapCampaignRow, mapSegmentRow } from "./mappers";
import type { SalonNotificationService } from "./notifications";
import type { SalonRepository } from "./repository";
import { evaluateSegment, type SegmentEvaluationResult } from "./segmentation";

export type CreateSegmentInput = {
  name: string;
  criteria: SegmentCriteria;
  createdBy?: string;
};

export type CreateCampaignDraftInput = {
  name: string;
  segmentId?: string;
  criteria: SegmentCriteria;
  campaignType?: CampaignType;
  channel?: CampaignChannel;
  templateKey?: string;
  messageBody: string;
  scheduledAt?: string;
  createdBy?: string;
};

export type CampaignListFilter = { status?: CampaignStatus };

export type SendCampaignResult = { queued: number; skipped: number };

export class SalonCampaignsRepository {
  constructor(
    private readonly client: SalonSupabaseClient,
    private readonly repo: SalonRepository,
    private readonly notifications: SalonNotificationService
  ) {}

  // -------------------------------------------------------------------
  // Segments
  // -------------------------------------------------------------------

  async createSegment(organizationId: string, input: CreateSegmentInput): Promise<Result<SalonSegment>> {
    if (!input.name.trim()) return fail("invalid_input", "Segment name is required.");
    const { data, error } = await this.client
      .from("salon_segments")
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        criteria: input.criteria ?? {},
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No segment returned after insert.");
    return ok(mapSegmentRow(data));
  }

  async listSegments(organizationId: string): Promise<Result<SalonSegment[]>> {
    const { data, error } = await this.client
      .from("salon_segments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapSegmentRow));
  }

  async getSegment(segmentId: string): Promise<Result<SalonSegment>> {
    const { data, error } = await this.client.from("salon_segments").select("*").eq("id", segmentId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Segment not found.");
    return ok(mapSegmentRow(data));
  }

  /** Preview against arbitrary (not-yet-saved) criteria — used before a segment or campaign is even created. */
  async previewCriteria(organizationId: string, criteria: SegmentCriteria): Promise<Result<SegmentEvaluationResult>> {
    return evaluateSegment(this.repo, organizationId, criteria);
  }

  // -------------------------------------------------------------------
  // Campaigns
  // -------------------------------------------------------------------

  async createCampaignDraft(organizationId: string, input: CreateCampaignDraftInput): Promise<Result<SalonCampaign>> {
    if (!input.name.trim()) return fail("invalid_input", "Campaign name is required.");
    if (!input.messageBody.trim()) return fail("invalid_input", "Message body is required.");
    const { data, error } = await this.client
      .from("salon_campaigns")
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        segment_id: input.segmentId ?? null,
        criteria: input.criteria ?? {},
        campaign_type: input.campaignType ?? "custom",
        channel: input.channel ?? "whatsapp",
        template_key: input.templateKey ?? "salon.campaign.custom",
        message_body: input.messageBody.trim(),
        status: "draft",
        scheduled_at: input.scheduledAt ?? null,
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No campaign returned after insert.");
    return ok(mapCampaignRow(data));
  }

  async getCampaign(campaignId: string): Promise<Result<SalonCampaign>> {
    const { data, error } = await this.client.from("salon_campaigns").select("*").eq("id", campaignId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Campaign not found.");
    return ok(mapCampaignRow(data));
  }

  async listCampaigns(organizationId: string, filter: CampaignListFilter = {}): Promise<Result<SalonCampaign[]>> {
    const { data, error } = await this.client
      .from("salon_campaigns")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    let rows = (data ?? []).map(mapCampaignRow);
    if (filter.status) rows = rows.filter((c) => c.status === filter.status);
    return ok(rows);
  }

  /**
   * Evaluates the campaign's *own* stored criteria snapshot (not a live
   * segment reference — editing a segment later must never silently
   * change what an already-drafted campaign will send to) and records the
   * resulting count as `estimated_audience` for the console UI.
   */
  async previewAudience(organizationId: string, campaignId: string): Promise<Result<SegmentEvaluationResult>> {
    const campaignResult = await this.getCampaign(campaignId);
    if (!campaignResult.ok) return campaignResult;

    const evalResult = await evaluateSegment(this.repo, organizationId, campaignResult.data.criteria);
    if (!evalResult.ok) return evalResult;

    await this.client
      .from("salon_campaigns")
      .update({ estimated_audience: evalResult.data.eligible.length })
      .eq("id", campaignId);

    return evalResult;
  }

  async approveCampaign(campaignId: string, currentStatus: CampaignStatus, approvedBy?: string): Promise<Result<true>> {
    if (!canTransitionCampaignStatus(currentStatus, "approved")) {
      return fail("invalid_transition", `Cannot approve a campaign in "${currentStatus}" status.`);
    }
    const { error } = await this.client
      .from("salon_campaigns")
      .update({ status: "approved", approved_by: approvedBy ?? null, approved_at: new Date().toISOString() })
      .eq("id", campaignId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  async listRecipients(campaignId: string): Promise<Result<SalonCampaignRecipient[]>> {
    const { data, error } = await this.client
      .from("salon_campaign_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapCampaignRecipientRow));
  }

  async cancelCampaign(campaignId: string, currentStatus: CampaignStatus): Promise<Result<true>> {
    if (!canTransitionCampaignStatus(currentStatus, "cancelled")) {
      return fail("invalid_transition", `Cannot cancel a campaign in "${currentStatus}" status.`);
    }
    const { error } = await this.client.from("salon_campaigns").update({ status: "cancelled" }).eq("id", campaignId);
    if (error) return fail("db_error", error.message);
    return ok(true);
  }

  /**
   * Re-validates the audience (never trusts the earlier preview), flips
   * the campaign to `sending`, then creates one `salon_campaign_recipients`
   * row per customer considered (eligible -> `pending` + enqueued;
   * excluded -> `skipped` + `skip_reason`, so the exclusion is visible on
   * the campaign detail page, not silently dropped). Idempotent: a retried
   * call (e.g. a crashed worker resuming) upserts on the
   * `(campaign_id, customer_id)` unique constraint rather than creating
   * duplicate rows or re-enqueuing an already-enqueued message (the
   * notification idempotency key `campaign:{campaignId}:{customerId}`
   * covers the enqueue step itself).
   */
  async sendCampaign(organizationId: string, campaignId: string, currentStatus: CampaignStatus): Promise<Result<SendCampaignResult>> {
    if (!canTransitionCampaignStatus(currentStatus, "sending")) {
      return fail("invalid_transition", `Cannot send a campaign in "${currentStatus}" status.`);
    }

    const campaignResult = await this.getCampaign(campaignId);
    if (!campaignResult.ok) return campaignResult;
    const campaign = campaignResult.data;

    const evalResult = await evaluateSegment(this.repo, organizationId, campaign.criteria);
    if (!evalResult.ok) return evalResult;

    const { error: statusError } = await this.client.from("salon_campaigns").update({ status: "sending" }).eq("id", campaignId);
    if (statusError) return fail("db_error", statusError.message);

    let queued = 0;
    let skipped = 0;

    for (const excludedEntry of evalResult.data.excluded) {
      const { error } = await this.client.from("salon_campaign_recipients").upsert(
        {
          organization_id: organizationId,
          campaign_id: campaignId,
          customer_id: excludedEntry.customer.id,
          status: "skipped",
          skip_reason: excludedEntry.reason,
        },
        { onConflict: "campaign_id,customer_id", ignoreDuplicates: true }
      );
      if (!error) skipped++;
    }

    for (const customer of evalResult.data.eligible) {
      const { error: upsertError } = await this.client.from("salon_campaign_recipients").upsert(
        {
          organization_id: organizationId,
          campaign_id: campaignId,
          customer_id: customer.id,
          status: "pending",
        },
        { onConflict: "campaign_id,customer_id", ignoreDuplicates: true }
      );
      if (upsertError) {
        skipped++;
        continue;
      }

      const { data: recipientRow, error: selectError } = await this.client
        .from("salon_campaign_recipients")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("customer_id", customer.id)
        .single();
      if (selectError || !recipientRow) {
        skipped++;
        continue;
      }
      const recipient = mapCampaignRecipientRow(recipientRow);

      // Already resolved by a prior (partial/retried) send — never re-enqueue.
      if (recipient.status !== "pending") {
        if (recipient.status === "sent" || recipient.status === "delivered" || recipient.status === "converted") queued++;
        else skipped++;
        continue;
      }

      const enqueueResult = await this.notifications.enqueue({
        organizationId,
        event: "campaign.message",
        recipientPhone: customer.phone,
        preferredChannel: customer.preferredChannel,
        optedOutAt: customer.optedOutAt,
        payload: { campaignId, customerId: customer.id, messageBody: campaign.messageBody, organizationId },
        idempotencyKey: `campaign:${campaignId}:${customer.id}`,
        campaignRecipientId: recipient.id,
      });

      if (enqueueResult.ok && !enqueueResult.data.skipped) {
        await this.client
          .from("salon_campaign_recipients")
          .update({ notification_outbox_id: enqueueResult.data.outboxId })
          .eq("id", recipient.id);
        queued++;
      } else {
        const skipReason = !enqueueResult.ok
          ? enqueueResult.error.message
          : enqueueResult.data.skipped
            ? enqueueResult.data.reason
            : "Not queued.";
        await this.client
          .from("salon_campaign_recipients")
          .update({ status: "skipped", skip_reason: skipReason })
          .eq("id", recipient.id);
        skipped++;
      }
    }

    return ok({ queued, skipped });
  }
}
