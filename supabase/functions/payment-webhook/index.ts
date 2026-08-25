import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verifyRazorpayWebhookSignatureAsync } from "../_shared/razorpay.ts";

/**
 * Razorpay payment.captured → mark service_orders paid → assign_service_order().
 * See docs/architecture/SERVICES-MIGRATION.md
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

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const webhookSecret =
      Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? Deno.env.get("RINADS_RAZORPAY_SECRET") ?? "";

    if (webhookSecret) {
      const valid = await verifyRazorpayWebhookSignatureAsync(body, signature, webhookSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
      }
    } else {
      console.warn("payment-webhook: RAZORPAY_WEBHOOK_SECRET not set — skipping signature verify");
    }

    const payload = JSON.parse(body);
    const eventId =
      payload?.payload?.payment?.entity?.id ??
      payload?.payload?.order?.entity?.id ??
      payload?.event_id ??
      `${payload?.event}-${payload?.created_at}`;
    const eventType = payload?.event ?? "unknown";

    const { error: idemError } = await supabase.from("payment_webhook_events").insert({
      provider: "razorpay",
      event_id: String(eventId),
      event_type: eventType,
      payload,
    });
    if (idemError?.code === "23505") {
      return new Response(JSON.stringify({ status: "duplicate", event_id: eventId }), { status: 200 });
    }
    if (idemError) throw idemError;

    if (eventType !== "payment.captured") {
      return new Response(JSON.stringify({ status: "ignored", event: eventType }), { status: 200 });
    }

    const payment = payload?.payload?.payment?.entity;
    const orderId = payment?.notes?.service_order_id as string | undefined;
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing service_order_id in notes" }), { status: 422 });
    }

    const { error: payError } = await supabase
      .from("service_orders")
      .update({
        status: "paid",
        razorpay_payment_id: payment.id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .in("status", ["pending", "paid"]);

    if (payError) throw payError;

    const { data: assignResult, error: assignError } = await supabase.rpc("assign_service_order", {
      p_order_id: orderId,
    });
    if (assignError) throw assignError;

    const { data: orderRow } = await supabase
      .from("service_orders")
      .select("organization_id, order_number")
      .eq("id", orderId)
      .single();

    const functionsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (assignResult?.assigned && orderRow) {
      const notifyHeaders = {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      };

      // Client confirmation
      await fetch(`${functionsUrl}/notify-whatsapp`, {
        method: "POST",
        headers: notifyHeaders,
        body: JSON.stringify({
          organization_id: orderRow.organization_id,
          order_id: orderId,
          recipient: "client",
          template: "order_confirmation",
          message_body: `✅ RINADS — Order ${orderRow.order_number} confirmed!\n\nYour service has been assigned to our team. We'll keep you updated on progress.\n\nTrack: rinadsone.in/track/${orderId.slice(0, 8)}`,
        }),
      }).catch((e) => console.error("notify-whatsapp client", e));

      // Partner/intern task assignment
      await fetch(`${functionsUrl}/notify-whatsapp`, {
        method: "POST",
        headers: notifyHeaders,
        body: JSON.stringify({
          organization_id: orderRow.organization_id,
          order_id: orderId,
          recipient: "intern",
          template: "task_assigned",
          message_body: `🔔 RINADS — New task assigned!\n\nOrder: ${orderRow.order_number}\n\nPlease acknowledge and begin work. Reply for support.`,
        }),
      }).catch((e) => console.error("notify-whatsapp intern", e));
    }

    return new Response(
      JSON.stringify({ status: "success", order_id: orderId, assignment: assignResult }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("payment-webhook", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
