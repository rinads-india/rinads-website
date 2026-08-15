import {
  subscriptionFromRazorpayWebhook,
  mirrorSubscriptionToOrg,
} from "./subscriptions";
import { verifyRazorpayWebhookSignature, type RazorpaySubscriptionPayload } from "./providers/razorpay";
import type { BillingWebhookEvent } from "./index";

export type WebhookHandlerClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    upsert: (rows: Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> & {
        single?: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
};

export type WebhookProcessResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string; status: number };

export async function processRazorpayWebhook(
  client: WebhookHandlerClient,
  input: {
    rawBody: string;
    signature: string;
    webhookSecret: string;
    resolveOrganizationId: (payload: Record<string, unknown>) => Promise<string | null>;
    resolvePlanKey: (payload: Record<string, unknown>) => Promise<string>;
  }
): Promise<WebhookProcessResult> {
  if (!verifyRazorpayWebhookSignature(input.rawBody, input.signature, input.webhookSecret)) {
    return { ok: false, error: "Invalid signature", status: 401 };
  }

  const payload = JSON.parse(input.rawBody) as Record<string, unknown>;
  const eventType = String(payload.event ?? "unknown");
  const entity = (payload.payload as Record<string, unknown>)?.subscription as
    | RazorpaySubscriptionPayload
    | undefined;
  const idempotencyKey = String(payload.id ?? `${eventType}:${entity?.id ?? Date.now()}`);

  const { data: existing } = await client
    .from("billing_events")
    .select("id")
    .eq("idempotency_key", idempotencyKey);
  if (existing?.length) {
    return { ok: true, duplicate: true };
  }

  const organizationId = await input.resolveOrganizationId(payload);
  const redactedPayload = { event: eventType, subscription_id: entity?.id };

  await client.from("billing_events").insert({
    organization_id: organizationId,
    provider: "razorpay",
    event_type: eventType,
    idempotency_key: idempotencyKey,
    payload: redactedPayload,
    processed_at: new Date().toISOString(),
  });

  if (
    organizationId &&
    entity &&
    (eventType === "subscription.activated" ||
      eventType === "subscription.charged" ||
      eventType === "subscription.updated")
  ) {
    const planKey = await input.resolvePlanKey(payload);
    const mirror = subscriptionFromRazorpayWebhook(organizationId, planKey, entity);
    const rows = mirrorSubscriptionToOrg(mirror);

    await client.from("organization_subscriptions").upsert([rows.organization_subscriptions]);
    await client.from("billing_subscriptions").upsert([rows.billing_subscriptions]);
  }

  if (organizationId && eventType === "payment.failed") {
    await client.from("organization_subscriptions").upsert([
      {
        organization_id: organizationId,
        status: "past_due",
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  return { ok: true };
}

export function parseBillingWebhookEvent(raw: Record<string, unknown>): BillingWebhookEvent {
  return {
    eventType: String(raw.event_type ?? raw.event ?? "unknown"),
    idempotencyKey: String(raw.idempotency_key ?? raw.id ?? ""),
    organizationId: raw.organization_id ? String(raw.organization_id) : undefined,
    payload: (raw.payload as Record<string, unknown>) ?? {},
  };
}
