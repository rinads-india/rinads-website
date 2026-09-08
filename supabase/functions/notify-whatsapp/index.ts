import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Server-side WhatsApp dispatch via the real Twilio WhatsApp API, plus the
 * existing `whatsapp_log` audit row. Twilio credentials
 * (`RINADS_TWILIO_SID` / `RINADS_TWILIO_TOKEN` / `RINADS_TWILIO_WHATSAPP_FROM`)
 * are server-only secrets — never exposed to apps/rinaglow.
 *
 * Internal-only function: it must only ever be called by other trusted
 * server code (the salon-server outbox worker, payment-webhook) using the
 * service-role key, never by a public client. Reject any request that
 * doesn't present that key.
 *
 * Honest states only (R GLOW Phase E) — this function never fabricates a
 * "sent" result. When Twilio credentials aren't configured it returns
 * `{status:"not_configured"}` so callers (`processSalonNotificationOutbox`)
 * can hold the message in a visibly-not-configured state instead of
 * silently pretending delivery happened. A genuine Twilio API failure is
 * likewise surfaced as `{status:"failed", error}` with Twilio's own error
 * message, never swallowed into a fake success.
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { organization_id, order_id, recipient, template, message_body } = await req.json();

    const twilioSid = Deno.env.get("RINADS_TWILIO_SID");
    const twilioToken = Deno.env.get("RINADS_TWILIO_TOKEN");
    const twilioFrom = Deno.env.get("RINADS_TWILIO_WHATSAPP_FROM");

    if (!twilioSid || !twilioToken || !twilioFrom) {
      const { error } = await supabase.from("whatsapp_log").insert({
        organization_id,
        order_id: order_id ?? null,
        recipient,
        template,
        message_body,
        status: "queued",
      });
      if (error) throw error;
      return new Response(JSON.stringify({ status: "not_configured" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const statusCallback = `${supabaseUrl}/functions/v1/notify-whatsapp-webhook`;
    const toAddress = String(recipient).startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`;
    const fromAddress = twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`;

    const form = new URLSearchParams();
    form.set("To", toAddress);
    form.set("From", fromAddress);
    form.set("Body", String(message_body));
    form.set("StatusCallback", statusCallback);

    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const twilioJson: Record<string, unknown> = await twilioResponse.json().catch(() => ({}));

    if (!twilioResponse.ok) {
      const errorMessage =
        typeof twilioJson.message === "string" ? twilioJson.message : `Twilio responded ${twilioResponse.status}`;
      const { error } = await supabase.from("whatsapp_log").insert({
        organization_id,
        order_id: order_id ?? null,
        recipient,
        template,
        message_body,
        status: "failed",
        provider_id: typeof twilioJson.sid === "string" ? twilioJson.sid : null,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ status: "failed", error: errorMessage }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const providerId = String(twilioJson.sid ?? "");
    const { error } = await supabase.from("whatsapp_log").insert({
      organization_id,
      order_id: order_id ?? null,
      recipient,
      template,
      message_body,
      status: "sent",
      provider_id: providerId,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ status: "sent", provider_message_id: providerId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-whatsapp", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
