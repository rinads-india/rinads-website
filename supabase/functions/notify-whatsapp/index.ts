import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Server-side WhatsApp dispatch + whatsapp_log audit. Twilio credentials server-only. */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { organization_id, order_id, recipient, template, message_body } = await req.json();

    // TODO: Twilio WhatsApp API using RINADS_TWILIO_SID / RINADS_TWILIO_TOKEN
    const providerId = `stub-${crypto.randomUUID()}`;

    const { error } = await supabase.from("whatsapp_log").insert({
      organization_id,
      order_id,
      recipient,
      template,
      message_body,
      status: "sent",
      provider_id: providerId,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, provider_id: providerId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-whatsapp", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
