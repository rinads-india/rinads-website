import { createHash } from "node:crypto";
import {
  subscriptionFromRazorpayWebhook,
  mirrorSubscriptionToOrg,
} from "./subscriptions";
import {
  verifyRazorpayWebhookSignature,
  type OrganizationSubscriptionStatus,
  type RazorpaySubscriptionPayload,
} from "./providers/razorpay";
import type { BillingWebhookEvent } from "./index";

export type WebhookHandlerClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    upsert: (
      rows: Record<string, unknown>[],
      options?: { onConflict?: string },
    ) => Promise<{ error: { message: string } | null }>;
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> & {
        single?: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
};

export type WebhookProcessResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string; status: number };

export type SubscriptionReconciledEvent = {
  organizationId: string;
  planKey: string;
  eventType: string;
  providerSubscriptionId: string;
  providerStatus: string;
  organizationStatus: OrganizationSubscriptionStatus;
};

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.completed",
  "subscription.updated",
  "subscription.pending",
  "subscription.halted",
  "subscription.paused",
  "subscription.resumed",
  "subscription.cancelled",
]);

/** Supports current Razorpay `payload.subscription.entity` and legacy direct payloads. */
export function extractRazorpaySubscriptionEntity(
  payload: Record<string, unknown>,
): RazorpaySubscriptionPayload | undefined {
  const rootPayload = payload.payload;
  if (!rootPayload || typeof rootPayload !== "object") return undefined;

  const subscription = (rootPayload as Record<string, unknown>).subscription;
  if (!subscription || typeof subscription !== "object") return undefined;

  const maybeEntity = (subscription as Record<string, unknown>).entity;
  const entity =
    maybeEntity && typeof maybeEntity === "object"
      ? (maybeEntity as Record<string, unknown>)
      : (subscription as Record<string, unknown>);

  if (typeof entity.id !== "string" || typeof entity.status !== "string") {
    return undefined;
  }
  return entity as RazorpaySubscriptionPayload;
}

function stableWebhookIdempotencyKey(
  eventType: string,
  rawBody: string,
  eventId?: string,
): string {
  if (eventId?.trim()) return eventId.trim();
  return `${eventType}:${createHash("sha256").update(rawBody).digest("hex")}`;
}

export async function processRazorpayWebhook(
  client: WebhookHandlerClient,
  input: {
    rawBody: string;
    signature: string;
    webhookSecret: string;
    eventId?: string;
    resolveOrganizationId: (payload: Record<string, unknown>) => Promise<string | null>;
    resolvePlanKey: (payload: Record<string, unknown>) => Promise<string | null>;
    onSubscriptionReconciled?: (
      event: SubscriptionReconciledEvent,
    ) => Promise<{ ok: true } | { ok: false; error: string }>;
  },
): Promise<WebhookProcessResult> {
  if (!verifyRazorpayWebhookSignature(input.rawBody, input.signature, input.webhookSecret)) {
    return { ok: false, error: "Invalid signature", status: 401 };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(input.rawBody) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Invalid JSON payload", status: 400 };
  }

  const eventType = String(payload.event ?? "unknown");
  const entity = extractRazorpaySubscriptionEntity(payload);
  const idempotencyKey = stableWebhookIdempotencyKey(eventType, input.rawBody, input.eventId);

  const existingResult = await client
    .from("billing_events")
    .select("id")
    .eq("idempotency_key", idempotencyKey);
  if (existingResult.error) {
    return { ok: false, error: "Could not check billing event idempotency", status: 500 };
  }
  if (existingResult.data?.length) {
    return { ok: true, duplicate: true };
  }

  const organizationId = await input.resolveOrganizationId(payload);

  if (SUBSCRIPTION_EVENTS.has(eventType)) {
    if (!entity) {
      return { ok: false, error: "Subscription entity missing", status: 422 };
    }
    if (!organizationId) {
      return { ok: false, error: "Subscription organization unresolved", status: 422 };
    }

    const planKey = await input.resolvePlanKey(payload);
    if (!planKey) {
      return { ok: false, error: "Subscription plan unresolved", status: 422 };
    }

    const mirror = subscriptionFromRazorpayWebhook(organizationId, planKey, entity);
    const rows = mirrorSubscriptionToOrg(mirror);

    const orgUpsert = await client
      .from("organization_subscriptions")
      .upsert([rows.organization_subscriptions], { onConflict: "organization_id" });
    if (orgUpsert.error) {
      return { ok: false, error: "Could not reconcile organization subscription", status: 500 };
    }

    const billingUpsert = await client
      .from("billing_subscriptions")
      .upsert([rows.billing_subscriptions], {
        onConflict: "provider,provider_subscription_id",
      });
    if (billingUpsert.error) {
      return { ok: false, error: "Could not reconcile provider subscription", status: 500 };
    }

    // Run activation side effects before recording the billing event. If the
    // callback fails, Razorpay can retry the same event: subscription upserts are
    // idempotent and the event remains unacknowledged until provisioning handoff
    // succeeds.
    if (input.onSubscriptionReconciled) {
      const callback = await input.onSubscriptionReconciled({
        organizationId,
        planKey,
        eventType,
        providerSubscriptionId: entity.id,
        providerStatus: entity.status,
        organizationStatus: mirror.organizationStatus,
      });
      if (!callback.ok) {
        return { ok: false, error: callback.error, status: 500 };
      }
    }
  }

  const redactedPayload = {
    event: eventType,
    subscription_id: entity?.id,
    subscription_status: entity?.status,
  };
  const eventInsert = await client.from("billing_events").insert({
    organization_id: organizationId,
    provider: "razorpay",
    event_type: eventType,
    idempotency_key: idempotencyKey,
    payload: redactedPayload,
    processed_at: new Date().toISOString(),
  });
  if (eventInsert.error) {
    return { ok: false, error: "Could not record billing event", status: 500 };
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
