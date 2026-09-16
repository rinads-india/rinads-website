/**
 * Real Twilio WhatsApp delivery (R GLOW Phase E, Slice 1) — honest states
 * only. `createTwilioWhatsAppAdapter` calls the `notify-whatsapp` edge
 * function (which holds the actual `RINADS_TWILIO_SID`/`RINADS_TWILIO_TOKEN`
 * secrets server-side) and surfaces a real provider message id on success,
 * `not_configured` when Twilio credentials are absent, or a real failure —
 * it never fabricates a "sent" status the way the old stub did.
 *
 * `processSalonNotificationOutbox` is the worker loop: bounded exponential
 * backoff on failure (same formula family as
 * `packages/runtime/src/queue/durable-queue.ts`'s `computeBackoffMs`),
 * `dead_letter` after `maxAttempts`, and a separate, much longer fixed
 * recheck interval for `not_configured` rows — a missing secret is an
 * environment problem, not a per-message failure, so it should never
 * exhaust attempts or get dead-lettered.
 */
import type { SalonRow, SalonSupabaseClient } from "./client";

export const WHATSAPP_BODY_MAX_CHARS = 1600;

export function validateWhatsAppBody(body: string): { ok: true } | { ok: false; error: string } {
  if (body.length > WHATSAPP_BODY_MAX_CHARS) {
    return { ok: false, error: `WhatsApp message body must be ${WHATSAPP_BODY_MAX_CHARS} characters or fewer.` };
  }
  return { ok: true };
}

export type TwilioSendResult =
  | { status: "sent"; providerMessageId: string }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export type SalonNotificationAdapter = {
  send(input: { recipient: string; templateKey: string; payload: Record<string, unknown> }): Promise<TwilioSendResult>;
};

export function createTwilioWhatsAppAdapter(config: { supabaseUrl: string; serviceRoleKey: string }): SalonNotificationAdapter {
  return {
    async send(input): Promise<TwilioSendResult> {
      const messageBody = String(input.payload.messageBody ?? input.templateKey);
      const validation = validateWhatsAppBody(messageBody);
      if (!validation.ok) return { status: "failed", error: validation.error };
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
            campaign_recipient_id: input.payload.campaignRecipientId,
          }),
        });

        let json: Record<string, unknown> = {};
        try {
          json = await response.json();
        } catch {
          // A non-JSON error body falls through to the generic failure below.
        }

        if (!response.ok) {
          return { status: "failed", error: typeof json.error === "string" ? json.error : `notify-whatsapp responded ${response.status}` };
        }
        if (json.status === "not_configured") {
          return { status: "not_configured" };
        }
        if (json.status === "sent" && typeof json.provider_message_id === "string") {
          return { status: "sent", providerMessageId: json.provider_message_id };
        }
        if (json.status === "failed") {
          return { status: "failed", error: typeof json.error === "string" ? json.error : "Twilio send failed." };
        }
        return { status: "failed", error: "notify-whatsapp returned an unexpected response." };
      } catch (error) {
        return { status: "failed", error: error instanceof Error ? error.message : "Unknown delivery error." };
      }
    },
  };
}

/**
 * Twilio's WhatsApp `MessageStatus` StatusCallback values mapped to our
 * `notification_outbox.status` vocabulary. Pure and dependency-free so it
 * is unit-testable here — the Deno webhook function
 * (`supabase/functions/notify-whatsapp-webhook`) contains an inline,
 * algorithmically-identical copy, since edge functions can't import from
 * the pnpm workspace (the same documented duplication as
 * `supabase/functions/_shared/razorpay.ts` already is for the payment
 * webhook).
 */
export function mapTwilioStatusToOutboxStatus(
  twilioStatus: string
): "pending" | "processing" | "sent" | "delivered" | "read" | "failed" {
  switch (twilioStatus) {
    case "queued":
    case "accepted":
      return "pending";
    case "sending":
      return "processing";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
    case "undelivered":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Monotonic progression guard — an out-of-order or duplicate webhook
 * callback (Twilio retries webhooks that don't respond quickly) must never
 * move a message backwards (e.g. 'delivered' regressing to 'sent').
 */
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  processing: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
  not_configured: 5,
  dead_letter: 5,
};

export function isForwardStatusTransition(from: string, to: string): boolean {
  const fromRank = STATUS_RANK[from] ?? 0;
  const toRank = STATUS_RANK[to] ?? 0;
  return toRank >= fromRank;
}

function computeBackoffMs(attempt: number, baseMs: number, capMs: number): number {
  return Math.min(capMs, baseMs * Math.pow(2, attempt));
}

export type ProcessOutboxOptions = {
  maxAttempts?: number;
  baseBackoffMs?: number;
  capBackoffMs?: number;
  /** How long before re-checking a `not_configured` row — much longer than the failure backoff since this is a config problem, not a transient one. */
  notConfiguredRecheckMs?: number;
  now?: Date;
  /** Atomic claim batch, hard-capped at 100 even when misconfigured. */
  batchSize?: number;
  /** Delay between provider calls. Useful for respecting account throughput. */
  throughputDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  /** Test seam; production uses the service-role-only atomic claim RPC. */
  claim?: (limit: number) => Promise<SalonRow[]>;
};

export type ProcessOutboxSummary = {
  processed: number;
  sent: number;
  notConfigured: number;
  failed: number;
  deadLetter: number;
};

export async function processSalonNotificationOutbox(
  client: SalonSupabaseClient,
  adapter: SalonNotificationAdapter,
  options: ProcessOutboxOptions = {}
): Promise<ProcessOutboxSummary> {
  const maxAttempts = options.maxAttempts ?? 5;
  const baseBackoffMs = options.baseBackoffMs ?? 30_000;
  const capBackoffMs = options.capBackoffMs ?? 30 * 60 * 1000;
  const notConfiguredRecheckMs = options.notConfiguredRecheckMs ?? 15 * 60 * 1000;
  const now = options.now ?? new Date();
  const batchSize = Math.min(100, Math.max(1, Math.floor(options.batchSize ?? 25)));
  const throughputDelayMs = Math.max(0, Math.floor(options.throughputDelayMs ?? 0));
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  const summary: ProcessOutboxSummary = { processed: 0, sent: 0, notConfigured: 0, failed: 0, deadLetter: 0 };

  let eligible: SalonRow[];
  if (options.claim) {
    eligible = await options.claim(batchSize);
  } else {
    const { data, error } = await client.rpc("claim_due_salon_notification_outbox", { p_limit: batchSize });
    if (error || !Array.isArray(data)) return summary;
    eligible = data as SalonRow[];
  }

  for (let index = 0; index < eligible.length; index++) {
    const row = eligible[index];
    const id = String(row.id);
    const attempts = Number(row.attempts ?? 0);

    const result = await adapter.send({
      recipient: String(row.recipient),
      templateKey: String(row.template_key),
      payload: (row.payload as Record<string, unknown>) ?? {},
    });

    summary.processed++;
    if (throughputDelayMs > 0 && index < eligible.length - 1) await sleep(throughputDelayMs);

    if (result.status === "sent") {
      await client
        .from("notification_outbox")
        .update({
          status: "sent",
          provider: "twilio",
          provider_message_id: result.providerMessageId,
          attempts: attempts + 1,
          last_error: null,
          next_attempt_at: null,
        })
        .eq("id", id)
        .eq("status", "processing");
      summary.sent++;
      continue;
    }

    if (result.status === "not_configured") {
      await client
        .from("notification_outbox")
        .update({
          status: "not_configured",
          attempts: attempts + 1,
          last_error: "Twilio credentials are not configured.",
          next_attempt_at: new Date(now.getTime() + notConfiguredRecheckMs).toISOString(),
        })
        .eq("id", id)
        .eq("status", "processing");
      summary.notConfigured++;
      continue;
    }

    const nextAttempts = attempts + 1;
    if (nextAttempts >= maxAttempts) {
      await client
        .from("notification_outbox")
        .update({ status: "dead_letter", attempts: nextAttempts, last_error: result.error, next_attempt_at: null })
        .eq("id", id)
        .eq("status", "processing");
      summary.deadLetter++;
    } else {
      await client
        .from("notification_outbox")
        .update({
          status: "failed",
          attempts: nextAttempts,
          last_error: result.error,
          next_attempt_at: new Date(now.getTime() + computeBackoffMs(nextAttempts, baseBackoffMs, capBackoffMs)).toISOString(),
        })
        .eq("id", id)
        .eq("status", "processing");
      summary.failed++;
    }
  }

  return summary;
}
