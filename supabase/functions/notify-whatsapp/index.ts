import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Server-side WhatsApp dispatch via Twilio + whatsapp_log audit.
 *
 * POST body:
 *   organization_id  UUID      (required)
 *   order_id         UUID      (optional — for order notifications)
 *   recipient        string    "client" | "intern" | explicit E.164 phone
 *   template         string    (audit label)
 *   message_body     string    (the message text)
 *   to_phone         string?   (explicit override — skips lookup)
 *
 * Env secrets required:
 *   RINADS_TWILIO_SID    — Twilio Account SID
 *   RINADS_TWILIO_TOKEN  — Twilio Auth Token
 *   RINADS_WA_FROM       — Twilio WhatsApp sender, e.g. whatsapp:+14155238886
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      organization_id,
      order_id,
      recipient,
      template,
      message_body,
      to_phone: toPhoneOverride,
    } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), { status: 422 });
    }
    if (!message_body) {
      return new Response(JSON.stringify({ error: "message_body required" }), { status: 422 });
    }

    // ── Resolve destination phone ─────────────────────────────────────────
    let toPhone: string | null = toPhoneOverride ?? null;

    if (!toPhone && recipient === "client") {
      // Look up the organization owner's phone: org_members → auth.users
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, roles(name)")
        .eq("organization_id", organization_id)
        .eq("status", "active")
        .limit(5);

      // Find the owner member
      const ownerMember = members?.find((m: any) =>
        (m.roles?.name ?? "").toLowerCase() === "owner"
      ) ?? members?.[0];

      if (ownerMember?.user_id) {
        const { data: { user } } = await supabase.auth.admin.getUserById(ownerMember.user_id);
        toPhone = user?.phone ?? null;
      }
    }

    if (!toPhone && recipient === "intern" && order_id) {
      // Look up the assigned partner's phone via service_tasks → service_partners
      const { data } = await supabase
        .from("service_tasks")
        .select("service_partners(phone)")
        .eq("order_id", order_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      toPhone = (data as any)?.service_partners?.phone ?? null;
    }

    if (!toPhone && recipient && recipient.startsWith("+")) {
      toPhone = recipient;
    }

    // ── Twilio credentials ────────────────────────────────────────────────
    const twilioSid = Deno.env.get("RINADS_TWILIO_SID");
    const twilioToken = Deno.env.get("RINADS_TWILIO_TOKEN");
    const waFrom = Deno.env.get("RINADS_WA_FROM"); // e.g. whatsapp:+14155238886

    const twilioConfigured = !!(twilioSid && twilioToken && waFrom);

    let providerId: string | null = null;
    let sendStatus: "sent" | "failed" | "queued" = "queued";
    let errorMsg: string | null = null;

    if (twilioConfigured && toPhone) {
      // Normalise to whatsapp:+91... format
      const waTo = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;

      const formData = new URLSearchParams({
        From: waFrom!,
        To: waTo,
        Body: message_body,
      });

      const twilioUrl =
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

      const resp = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await resp.json();

      if (result.sid) {
        providerId = result.sid;
        sendStatus = "sent";
      } else {
        sendStatus = "failed";
        errorMsg = result.message ?? result.error_message ?? "Twilio error";
        console.error("notify-whatsapp twilio error", result);
      }
    } else if (!twilioConfigured) {
      // Credentials not yet set — log as queued for visibility
      console.warn("notify-whatsapp: Twilio not configured — message queued (stub)");
      providerId = `unconfigured-${crypto.randomUUID()}`;
      sendStatus = "queued";
    } else {
      // No phone resolved
      console.warn(`notify-whatsapp: no phone resolved for recipient="${recipient}"`);
      sendStatus = "failed";
      errorMsg = `No phone resolved for recipient: ${recipient}`;
    }

    // ── Audit log ─────────────────────────────────────────────────────────
    const { error: logError } = await supabase.from("whatsapp_log").insert({
      organization_id,
      order_id: order_id ?? null,
      recipient,
      template: template ?? null,
      message_body,
      status: sendStatus,
      provider_id: providerId,
    });
    if (logError) console.error("notify-whatsapp log insert", logError);

    if (sendStatus === "failed") {
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider_id: providerId, status: sendStatus }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("notify-whatsapp", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
