import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  type ShipmentRow,
} from "@rinads/database";
import {
  normalizeShiprocketWebhook,
  shiprocketWebhookEventKey,
  verifyShiprocketWebhookKey,
} from "@rinads/operations-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;

function persistenceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function shipmentUpdateFor(event: {
  type: string;
  occurredAt: string;
}): Partial<ShipmentRow> {
  const update: Partial<ShipmentRow> = { status: event.type };
  if (event.type === "delivered") update.delivered_at = event.occurredAt;
  return update;
}

export async function POST(request: Request) {
  const expectedKey = process.env.RINADS_LOGISTICS_WEBHOOK_KEY?.trim();
  if (!expectedKey) {
    return NextResponse.json(
      { ok: false, error: "Logistics callback is not configured." },
      { status: 503 }
    );
  }

  if (!verifyShiprocketWebhookKey(request.headers.get("x-api-key"), expectedKey)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  let normalized;
  try {
    normalized = normalizeShiprocketWebhook(body);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid logistics event." }, { status: 400 });
  }

  if (!persistenceConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Logistics persistence is not configured." },
      { status: 503 }
    );
  }

  const client = createServiceRoleClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  });

  const { data: shipmentRows, error: shipmentError } = await client
    .from("shipments")
    .select("id,organization_id,status,delivered_at")
    .eq("carrier", "shiprocket")
    .eq("awb", normalized.awb)
    .limit(2);

  if (shipmentError) {
    return NextResponse.json({ ok: false, error: "Shipment lookup failed." }, { status: 503 });
  }

  if (!shipmentRows || shipmentRows.length === 0) {
    // Fail closed instead of acknowledging and losing an event that may have raced
    // the shipment commit. A later provider retry can succeed once the AWB exists.
    return NextResponse.json({ ok: false, error: "Shipment is not persisted yet." }, { status: 503 });
  }

  if (shipmentRows.length !== 1) {
    return NextResponse.json({ ok: false, error: "Shipment ownership is ambiguous." }, { status: 409 });
  }

  const shipment = shipmentRows[0]!;
  const providerEventKey = shiprocketWebhookEventKey(normalized);
  const { data: existing, error: duplicateError } = await client
    .from("delivery_events")
    .select("id")
    .eq("shipment_id", shipment.id)
    .contains("raw_payload", { provider_event_key: providerEventKey })
    .limit(1);

  if (duplicateError) {
    return NextResponse.json({ ok: false, error: "Event deduplication failed." }, { status: 503 });
  }

  const duplicate = Boolean(existing?.length);
  if (!duplicate) {
    const { error: insertError } = await client.from("delivery_events").insert({
      shipment_id: shipment.id,
      event_type: normalized.event.type,
      label: normalized.event.label,
      occurred_at: normalized.event.occurredAt,
      raw_payload: {
        provider: "shiprocket",
        provider_event_key: providerEventKey,
        provider_status_id: normalized.providerStatusId ?? null,
        provider_status: normalized.providerStatus ?? null,
        provider_timestamp: normalized.providerTimestamp ?? null,
        courier_name: normalized.courierName ?? null,
        merchant_order_id: normalized.merchantOrderId ?? null,
        provider_order_id: normalized.providerOrderId ?? null,
      },
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: "Event persistence failed." }, { status: 503 });
    }
  }

  // Reconcile shipment state even for duplicate callbacks. This makes a retry
  // repair a prior partial success where the event insert committed but the
  // shipment update failed.
  const { error: updateError } = await client
    .from("shipments")
    .update(shipmentUpdateFor(normalized.event))
    .eq("id", shipment.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: "Shipment state update failed." }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    stored: !duplicate,
    duplicate,
    eventType: normalized.event.type,
  });
}
