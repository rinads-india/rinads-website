/**
 * SalonNotificationService (Part D) — provider-neutral, no fake delivery.
 *
 * Enqueues every customer-facing salon event into the *existing*
 * `notification_outbox` table (no new outbox table) with a template key
 * and idempotency key, respecting `salon_customers.preferred_channel` /
 * `opted_out_at`. Delivery is intentionally left in an observable
 * `pending` state here. The disabled-by-default communications worker
 * claims due rows atomically and sends WhatsApp messages through the
 * service-role-authenticated `notify-whatsapp` edge function. This service
 * never fakes a "sent" status, and browser code never receives a
 * service-role key.
 */
import { fail, ok, type PreferredChannel, type Result } from "@rinads/salon";
import type { NotificationAdapter, NotificationAdapterResult } from "@rinads/runtime";
import type { SalonSupabaseClient } from "./client";
import { validateWhatsAppBody } from "./notification-delivery";

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
  | "no_show.recovery_due"
  | "unconfirmed_booking.recovery_due"
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
    if (channel === "whatsapp" && typeof input.payload.messageBody === "string") {
      const validation = validateWhatsAppBody(input.payload.messageBody);
      if (!validation.ok) return fail("invalid_input", validation.error);
    }

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

  /**
   * Single-message retry (R GLOW Phase E, Slice 1) — resets a
   * `failed`/`dead_letter`/`not_configured` outbox row back to `pending`
   * with `next_attempt_at` cleared so `processSalonNotificationOutbox`
   * picks it up on its next pass. Refuses to "retry" a message that isn't
   * actually stuck (e.g. already `sent`/`delivered`), since that would be
   * indistinguishable from silently re-sending a message that already
   * went out. The permission-checked Phase E.2 RPC performs the mutation;
   * authenticated callers no longer have direct UPDATE access.
   */
  async retryMessage(organizationId: string, outboxId: string): Promise<Result<true>> {
    const { data, error } = await this.client.rpc("retry_salon_notification_outbox", {
      p_organization_id: organizationId,
      p_notification_outbox_id: outboxId,
      p_campaign_id: null,
      p_limit: 1,
    });
    if (error) return fail("db_error", error.message);
    if (Number((data as { count?: unknown } | null)?.count ?? 0) !== 1) {
      return fail("conflict", "Message was not retried; it may have been claimed by another operator.");
    }
    return ok(true);
  }
}

/**
 * Honest WhatsApp delivery adapter: calls the real `notify-whatsapp` edge
 * function and only ever reports success on a genuine 2xx response. Never
 * invoked automatically from a request path — it requires a service-role
 * bearer token, which no browser/user-session context should ever hold.
 */
export function createSalonWhatsAppEdgeAdapter(config: {
  supabaseUrl: string;
  serviceRoleKey: string;
}): NotificationAdapter {
  return {
    channel: "whatsapp",
    async send(input): Promise<NotificationAdapterResult> {
      const messageBody = String(input.payload.messageBody ?? input.templateKey);
      const validation = validateWhatsAppBody(messageBody);
      if (!validation.ok) return { ok: false, error: validation.error };
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
            message_body: messageBody,
            organization_id: input.payload.organizationId,
            order_id: input.payload.orderId,
          }),
        });
        const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (!response.ok || json.status === "failed") {
          const detail = typeof json.error === "string" ? json.error : response.statusText;
          return { ok: false, error: `notify-whatsapp responded ${response.status}: ${detail}` };
        }
        if (json.status === "not_configured") {
          return { ok: false, error: "Twilio credentials are not configured." };
        }
        return json.status === "sent"
          ? { ok: true }
          : { ok: false, error: "notify-whatsapp returned an unexpected response." };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Unknown delivery error" };
      }
    },
  };
}
