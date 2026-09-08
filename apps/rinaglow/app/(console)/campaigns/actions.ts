"use server";

import type { CampaignChannel, CampaignStatus, CampaignType, SegmentCriteria } from "@rinads/salon";
import { revalidatePath } from "next/cache";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export type FormActionState = { error?: string } | undefined;

function parseCriteria(formData: FormData): SegmentCriteria {
  const criteria: SegmentCriteria = {};
  const lastVisitBeforeDays = Number(formData.get("lastVisitBeforeDays"));
  if (Number.isFinite(lastVisitBeforeDays) && lastVisitBeforeDays > 0) criteria.lastVisitBeforeDays = lastVisitBeforeDays;
  const minVisits = Number(formData.get("minVisits"));
  if (Number.isFinite(minVisits) && minVisits > 0) criteria.minVisits = minVisits;
  const minLifetimeSpend = Number(formData.get("minLifetimeSpend"));
  if (Number.isFinite(minLifetimeSpend) && minLifetimeSpend > 0) criteria.minLifetimeSpend = minLifetimeSpend;
  const maxLifetimeSpend = Number(formData.get("maxLifetimeSpend"));
  if (Number.isFinite(maxLifetimeSpend) && maxLifetimeSpend > 0) criteria.maxLifetimeSpend = maxLifetimeSpend;
  // Defaults to true unless the operator explicitly unchecks it — never message opted-out customers by accident.
  criteria.communicationOptIn = formData.get("communicationOptIn") !== "false";
  return criteria;
}

export async function createCampaignDraftAction(_prevState: FormActionState, formData: FormData): Promise<FormActionState> {
  const tenancy = await requireTenancy();
  const { campaigns } = await getSalonDeps();

  const name = String(formData.get("name") ?? "").trim();
  const messageBody = String(formData.get("messageBody") ?? "").trim();
  const campaignType = (String(formData.get("campaignType") ?? "custom") as CampaignType) || "custom";
  const channel = (String(formData.get("channel") ?? "whatsapp") as CampaignChannel) || "whatsapp";
  if (!name || !messageBody) return { error: "A campaign name and message body are required." };

  const criteria = parseCriteria(formData);

  const result = await campaigns.createCampaignDraft(tenancy.organizationId, {
    name,
    messageBody,
    campaignType,
    channel,
    criteria,
    createdBy: tenancy.userId,
  });
  revalidatePath("/campaigns");
  revalidatePath("/growth");
  if (!result.ok) return { error: result.error.message };
  return undefined;
}

export async function previewAudienceAction(campaignId: string): Promise<{ ok: boolean; error?: string }> {
  const tenancy = await requireTenancy();
  const { campaigns } = await getSalonDeps();
  const result = await campaigns.previewAudience(tenancy.organizationId, campaignId);
  revalidatePath(`/campaigns/${campaignId}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function approveCampaignAction(
  campaignId: string,
  currentStatus: CampaignStatus
): Promise<{ ok: boolean; error?: string }> {
  const tenancy = await requireTenancy();
  const { campaigns } = await getSalonDeps();
  const result = await campaigns.approveCampaign(campaignId, currentStatus, tenancy.userId);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/growth");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function sendCampaignAction(
  campaignId: string,
  currentStatus: CampaignStatus
): Promise<{ ok: boolean; error?: string; queued?: number; skipped?: number }> {
  const tenancy = await requireTenancy();
  const { campaigns } = await getSalonDeps();
  const result = await campaigns.sendCampaign(tenancy.organizationId, campaignId, currentStatus);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/growth");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, queued: result.data.queued, skipped: result.data.skipped };
}

export async function cancelCampaignAction(
  campaignId: string,
  currentStatus: CampaignStatus
): Promise<{ ok: boolean; error?: string }> {
  await requireTenancy();
  const { campaigns } = await getSalonDeps();
  const result = await campaigns.cancelCampaign(campaignId, currentStatus);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/growth");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function retryMessageAction(campaignId: string, outboxId: string): Promise<{ ok: boolean; error?: string }> {
  await requireTenancy();
  const { notifications } = await getSalonDeps();
  const result = await notifications.retryMessage(outboxId);
  revalidatePath(`/campaigns/${campaignId}`);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}
