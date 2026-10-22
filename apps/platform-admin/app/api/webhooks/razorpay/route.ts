import { NextResponse } from "next/server";
import {
  extractRazorpaySubscriptionEntity,
  getRazorpayConfigFromEnv,
  processRazorpayWebhook,
} from "@rinads/billing";
import { createPlatformServiceClient } from "@/lib/supabase/server";

const ALLOWED_PLAN_KEYS = new Set(["starter", "growth", "platform"]);

type ServiceClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

async function lookupExistingSubscription(
  service: ServiceClient,
  subscriptionId: string,
): Promise<Record<string, unknown> | null> {
  const { data } = await service
    .from("billing_subscriptions")
    .select("organization_id, plan_key")
    .eq("provider_subscription_id", subscriptionId);
  return data?.[0] ?? null;
}

async function validateOrganizationNote(
  service: ServiceClient,
  organizationId: string | undefined,
): Promise<string | null> {
  if (!organizationId?.trim()) return null;
  const { data } = await service
    .from("organizations")
    .select("id")
    .eq("id", organizationId.trim());
  return data?.[0]?.id ? String(data[0].id) : null;
}

async function ensureProvisioningJob(
  service: ServiceClient,
  organizationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const idempotencyKey = `provision:${organizationId}`;
  const existingResult = await service
    .from("tenant_provisioning_jobs")
    .select("id,status,idempotency_key")
    .eq("organization_id", organizationId);

  if (existingResult.error) {
    return { ok: false, error: "Could not verify tenant provisioning handoff" };
  }
  if (
    (existingResult.data ?? []).some(
      (row) => String(row.idempotency_key ?? "") === idempotencyKey,
    )
  ) {
    return { ok: true };
  }

  const settingsResult = await service
    .from("organization_settings")
    .select("vertical_key")
    .eq("organization_id", organizationId);
  if (settingsResult.error) {
    return { ok: false, error: "Could not resolve tenant template for provisioning" };
  }

  const templateKey = settingsResult.data?.[0]?.vertical_key
    ? String(settingsResult.data[0].vertical_key)
    : "";
  if (!templateKey) {
    return { ok: false, error: "Tenant template missing for provisioning" };
  }

  const insertResult = await service.from("tenant_provisioning_jobs").insert({
    organization_id: organizationId,
    template_key: templateKey,
    status: "pending",
    idempotency_key: idempotencyKey,
  });
  if (!insertResult.error) return { ok: true };

  // A concurrent active subscription event may have won the insert race. Re-read
  // the idempotent handoff before returning an error so provider retries do not
  // manufacture duplicate provisioning jobs.
  const racedResult = await service
    .from("tenant_provisioning_jobs")
    .select("id,idempotency_key")
    .eq("organization_id", organizationId);
  if (
    !racedResult.error &&
    (racedResult.data ?? []).some(
      (row) => String(row.idempotency_key ?? "") === idempotencyKey,
    )
  ) {
    return { ok: true };
  }

  return { ok: false, error: "Could not enqueue tenant provisioning" };
}

export async function POST(request: Request) {
  const config = getRazorpayConfigFromEnv();
  if (!config) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? undefined;
  const service = createPlatformServiceClient();
  const queryService = service as unknown as ServiceClient;

  const result = await processRazorpayWebhook(service as never, {
    rawBody,
    signature,
    eventId,
    webhookSecret: config.webhookSecret,
    resolveOrganizationId: async (payload) => {
      const subscription = extractRazorpaySubscriptionEntity(payload);
      const notedOrganization = subscription?.notes?.organization_id;
      const validatedNote = await validateOrganizationNote(queryService, notedOrganization);
      if (validatedNote) return validatedNote;

      if (!subscription?.id) return null;
      const existing = await lookupExistingSubscription(queryService, subscription.id);
      return existing?.organization_id ? String(existing.organization_id) : null;
    },
    resolvePlanKey: async (payload) => {
      const subscription = extractRazorpaySubscriptionEntity(payload);
      const notedPlan = subscription?.notes?.plan_key;
      if (notedPlan && ALLOWED_PLAN_KEYS.has(notedPlan)) return notedPlan;

      if (!subscription?.id) return null;
      const existing = await lookupExistingSubscription(queryService, subscription.id);
      const existingPlan = existing?.plan_key ? String(existing.plan_key) : null;
      return existingPlan && ALLOWED_PLAN_KEYS.has(existingPlan) ? existingPlan : null;
    },
    onSubscriptionReconciled: async (event) => {
      // Only the provider lifecycle state `active` may cross the payment → tenant
      // provisioning boundary. Authenticated/created/pending/paused/etc. remain
      // fail-closed and do not enqueue tenant data seeding.
      if (event.organizationStatus !== "active") return { ok: true };
      return ensureProvisioningJob(queryService, event.organizationId);
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false });
}
