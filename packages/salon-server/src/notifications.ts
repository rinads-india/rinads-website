/**
 * SalonNotificationService (Part D) — provider-neutral, no fake delivery.
 *
 * Enqueues every customer-facing salon event into the *existing*
 * `notification_outbox` table (no new outbox table) with a template key
 * and idempotency key, respecting `salon_customers.preferred_channel` /
 * `opted_out_at`. Delivery is intentionally left in an observable
 * `pending` state here — actual transport is the existing `notify-whatsapp`
 * edge function (service-role authenticated, unchanged), whose own Twilio
 * send is still a documented `// TODO: Twilio` in that function. This
 * service does not fake a "sent" status; wiring a cron/job runner that
 * calls `deliverViaWhatsAppEdgeFunction` below with real service-role
 * credentials is left to a future pass (see Phase E notes in the
 * completion report) — apps/rinaglow itself never holds a service-role key.
 */
import { fail, ok, type PreferredChannel, type Result } from "@rinads/salon";
import type { NotificationAdapter, NotificationAdapterResult } from "@rinads/runtime";
import type { SalonSupabaseClient } from "./client";

export type SalonNotificationEvent =
  | "booking.created"
  | "booking.confirmed"
  | "booking.rescheduled"
  | "booking.cancelled"
  | "appointment.reminder_due"
  | "appointment.completed"
  | "payment.received"
  | "invoice.ready"
  | "review.request_due"
  | "customer.reactivation_due"
  /** A campaign message to one recipient (custom or reactivation) — see `campaigns-repository.ts`'s `sendCampaign`. */
  | "campaign.message";

export type EnqueueNotificationInput = {
  organizationId: string;
  event: SalonNotificationEvent;
  recipientPhone: string;
  preferredChannel: PreferredChannel;
  optedOutAt?: string;
  payload: Record<string, unknown>;
  /** Caller-supplied, deterministic per logical event (e.g. `booking.created:${appointmentId}`) — dedups retries. */
  idempotencyKey: string;
  /** Links the resulting outbox row back to its `salon_campaign_recipients` row, so delivery-state triggers can keep campaign aggregates in sync. */
  campaignRecipientId?: string;
};

export type EnqueueNotificationResult = { skipped: true; reason: string } | { skipped: false; outboxId: string };

export class SalonNotificationService {
  constructor(private readonly client: SalonSupabaseClient) {}

  async enqueue(input: EnqueueNotificationInput): Promise<Result<EnqueueNotificationResult>> {
    if (input.optedOutAt) {
      return ok({ skipped: true, reason: "Customer has opted out of communications." });
    }
    if (input.preferredChannel === "none") {
      return ok({ skipped: true, reason: "Customer has no preferred communication channel." });
    }

    const channel = input.preferredChannel === "email" ? "email" : input.preferredChannel === "sms" ? "sms" : "whatsapp";

    const { error } = await this.client.from("notification_outbox").upsert(
      {
        organization_id: input.organizationId,
        channel,
        template_key: `salon.${input.event}`,
        recipient: input.recipientPhone,
        payload: input.payload,
        idempotency_key: input.idempotencyKey,
        status: "pending",
        campaign_recipient_id: input.campaignRecipientId ?? null,
      },
      { onConflict: "organization_id,idempotency_key", ignoreDuplicates: true }
    );
    if (error) return fail("db_error", error.message);

    const { data: existing, error: selectError } = await this.client
      .from("notification_outbox")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("idempotency_key", input.idempotencyKey)
      .single();
    if (selectError) return fail("db_error", selectError.message);
    if (!existing) return fail("db_error", "No outbox row found after enqueue.");

    return ok({ skipped: false, outboxId: String((existing as { id: unknown }).id) });
  }
}

/**
 * Honest WhatsApp delivery adapter: calls the real `notify-whatsapp` edge
 * function and only ever reports success on a genuine 2xx response. Never
 * invoked automatically from a request path — it requires a service-role
 * bearer token, which no browser/user-session context should ever hold.
 * A future job runner (see Phase E) can pass this to
 * `packages/runtime`'s `processOutbox()` alongside the other adapters.
 */
export function createSalonWhatsAppEdgeAdapter(config: {
  supabaseUrl: string;
  serviceRoleKey: string;
}): NotificationAdapter {
  return {
    channel: "whatsapp",
    async send(input): Promise<NotificationAdapterResult> {
      try {
        const response = await fetch(`${config.supabaseUrl}/functions/v1/notify-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.serviceRoleKey}`,
          },
          body: JSON.stringify({
            recipient: input.recipient,
            template: input.templateKey,
            message_body: String(input.payload.messageBody ?? input.templateKey),
            organization_id: input.payload.organizationId,
            order_id: input.payload.orderId,
          }),
        });
        if (!response.ok) {
          const text = await response.text().catch(() => response.statusText);
          return { ok: false, error: `notify-whatsapp responded ${response.status}: ${text}` };
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Unknown delivery error" };
      }
    },
  };
}
