import type { SalonSupabaseClient } from "./client";
import type { SalonCampaignsRepository } from "./campaigns-repository";
import {
  processSalonNotificationOutbox,
  type ProcessOutboxSummary,
  type SalonNotificationAdapter,
} from "./notification-delivery";

export type CommunicationsWorkerOptions = {
  enabled: boolean;
  organizationIds: string[];
  batchSize?: number;
  throughputDelayMs?: number;
  maxScheduledCampaigns?: number;
  now?: Date;
  reviewsAutomationUrl?: string;
  reviewsAutomationToken?: string;
  reviewsAutomationLimit?: number;
  fetchImpl?: typeof fetch;
};

export type CommunicationsWorkerResult = {
  enabled: boolean;
  campaignsAdvanced: number;
  delivery: ProcessOutboxSummary;
  reviewsAutomationTriggered: boolean;
};

const EMPTY_DELIVERY: ProcessOutboxSummary = {
  processed: 0,
  sent: 0,
  notConfigured: 0,
  failed: 0,
  deadLetter: 0,
};

/**
 * One bounded worker tick. The caller must use a service-role client; the
 * atomic claim RPC rejects authenticated/anonymous sessions at the database.
 */
export async function runSalonCommunicationsWorker(
  client: SalonSupabaseClient,
  campaigns: SalonCampaignsRepository,
  adapter: SalonNotificationAdapter,
  options: CommunicationsWorkerOptions
): Promise<CommunicationsWorkerResult> {
  if (!options.enabled) {
    return { enabled: false, campaignsAdvanced: 0, delivery: { ...EMPTY_DELIVERY }, reviewsAutomationTriggered: false };
  }

  const now = options.now ?? new Date();
  const maxScheduledCampaigns = Math.min(10, Math.max(0, Math.floor(options.maxScheduledCampaigns ?? 2)));
  let campaignsAdvanced = 0;

  // Only explicitly scheduled, approved campaigns are advanced. An approved
  // campaign with no schedule never becomes an accidental production blast.
  for (const organizationId of options.organizationIds) {
    if (campaignsAdvanced >= maxScheduledCampaigns) break;
    const listed = await campaigns.listCampaigns(organizationId, { status: "approved" });
    if (!listed.ok) continue;
    const due = listed.data
      .filter((campaign) => campaign.scheduledAt && new Date(campaign.scheduledAt).getTime() <= now.getTime())
      .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)))
      .slice(0, maxScheduledCampaigns - campaignsAdvanced);
    for (const campaign of due) {
      const sent = await campaigns.sendCampaign(organizationId, campaign.id, campaign.status);
      if (sent.ok) campaignsAdvanced++;
    }
  }

  const delivery = await processSalonNotificationOutbox(client, adapter, {
    batchSize: Math.min(100, Math.max(1, Math.floor(options.batchSize ?? 25))),
    throughputDelayMs: Math.max(0, Math.floor(options.throughputDelayMs ?? 250)),
    now,
  });

  let reviewsAutomationTriggered = false;
  if (options.reviewsAutomationUrl) {
    const reviewsAutomationLimit = Math.min(100, Math.max(1, Math.floor(options.reviewsAutomationLimit ?? 50)));
    const response = await (options.fetchImpl ?? fetch)(options.reviewsAutomationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.reviewsAutomationToken ? { Authorization: `Bearer ${options.reviewsAutomationToken}` } : {}),
      },
      body: JSON.stringify({
        organizationIds: options.organizationIds,
        limit: reviewsAutomationLimit,
      }),
    });
    reviewsAutomationTriggered = response.ok;
  }

  return { enabled: true, campaignsAdvanced, delivery, reviewsAutomationTriggered };
}
