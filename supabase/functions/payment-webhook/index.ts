import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Razorpay payment.captured → mark service_orders paid → assign_service_order().
 * Verify signature + idempotency before mutating state.
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
    const payload = JSON.parse(body);
    const eventId = payload?.payload?.payment?.entity?.id ?? payload?.event_id;
    const eventType = payload?.event ?? "unknown";

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing event id" }), { status: 400 });
    }

    // TODO: verify Razorpay signature using RINADS_RAZORPAY_SECRET / webhook secret

    const { error: idemError } = await supabase.from("payment_webhook_events").insert({
      provider: "razorpay",
      event_id: eventId,
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

    return new Response(
      JSON.stringify({ status: "success", order_id: orderId, assignment: assignResult }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("payment-webhook", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
