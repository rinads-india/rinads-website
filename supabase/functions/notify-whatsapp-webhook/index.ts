import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isForwardStatusTransition, mapTwilioStatusToOutboxStatus, verifyTwilioSignatureAsync } from "../_shared/twilio.ts";

/**
 * Twilio WhatsApp delivery-status webhook (R GLOW Phase E, Slice 1) —
 * updates `notification_outbox.status` based on real Twilio callbacks only
 * (queued/sending/sent/delivered/read/failed/undelivered). The
 * `salon_sync_campaign_recipient_from_outbox` DB trigger (see
 * 20260908100001_salon_segments_and_campaigns.sql) then propagates this
 * into `salon_campaign_recipients` and campaign aggregate counts — this
 * function never touches those tables directly.
 *
 * Fail-closed signature verification (same posture as `payment-webhook`):
 * a missing `RINADS_TWILIO_TOKEN` or an invalid `X-Twilio-Signature` must
 * never be treated as "verification not required" — reject rather than
 * silently trusting an unverifiable payload.
 *
 * Idempotent via `notification_delivery_events`'
 * `UNIQUE(provider, provider_message_id, provider_status)` — Twilio
 * retries webhooks that don't 200 quickly, so a duplicate callback must
 * never double-apply the same status transition. Status transitions are
 * also monotonic (`isForwardStatusTransition`) so an out-of-order replay
 * can never move a message backwards (e.g. `delivered` regressing to
 * `sent`).
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const bodyText = await req.text();
    const params = Object.fromEntries(new URLSearchParams(bodyText).entries());

    const authToken = Deno.env.get("RINADS_TWILIO_TOKEN") ?? "";
    if (!authToken) {
      console.error("notify-whatsapp-webhook: RINADS_TWILIO_TOKEN not configured — refusing to process");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500 });
    }

    const signature = req.headers.get("x-twilio-signature") ?? "";
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-whatsapp-webhook`;
    const valid = await verifyTwilioSignatureAsync(webhookUrl, params, signature, authToken);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const messageSid = params.MessageSid || params.SmsSid;
    const messageStatus = (params.MessageStatus || params.SmsStatus || "").toLowerCase();
    const errorCode = params.ErrorCode;

    if (!messageSid || !messageStatus) {
      return new Response(JSON.stringify({ status: "ignored", reason: "Missing MessageSid/MessageStatus" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: outboxRow, error: lookupError } = await supabase
      .from("notification_outbox")
      .select("id, organization_id, status")
      .eq("provider", "twilio")
      .eq("provider_message_id", messageSid)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const { error: idemError } = await supabase.from("notification_delivery_events").insert({
      organization_id: outboxRow?.organization_id ?? null,
      notification_outbox_id: outboxRow?.id ?? null,
      provider: "twilio",
      provider_message_id: messageSid,
      provider_status: messageStatus,
      raw_payload: params,
    });
    if (idemError?.code === "23505") {
      return new Response(JSON.stringify({ status: "duplicate" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (idemError) throw idemError;

    if (!outboxRow) {
      return new Response(JSON.stringify({ status: "ignored", reason: "Unknown provider_message_id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newStatus = mapTwilioStatusToOutboxStatus(messageStatus);
    if (isForwardStatusTransition(outboxRow.status, newStatus)) {
      const patch: Record<string, unknown> = { status: newStatus };
      if (newStatus === "failed" && errorCode) patch.last_error = `Twilio error ${errorCode}`;
      const { error: updateError } = await supabase.from("notification_outbox").update(patch).eq("id", outboxRow.id);
      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-whatsapp-webhook", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
