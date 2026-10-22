import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type JsonRecord = Record<string, unknown>;

type WixEvent = {
  provider: "wix";
  eventId: string;
  eventType: string;
  instanceId: string;
  data: unknown;
  identity?: unknown;
  receivedAt: string;
};

type CanonicalDescriptor = {
  eventType: string;
  entityType: string;
  entityId?: string;
};

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function parseEvent(value: unknown): WixEvent | null {
  const event = asRecord(value);
  if (!event) return null;
  if (
    event.provider !== "wix" ||
    typeof event.eventId !== "string" || !event.eventId ||
    typeof event.eventType !== "string" || !event.eventType ||
    typeof event.instanceId !== "string" || !event.instanceId ||
    typeof event.receivedAt !== "string" || Number.isNaN(Date.parse(event.receivedAt))
  ) {
    return null;
  }
  return event as unknown as WixEvent;
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

function extractProviderEntityId(data: unknown): string | undefined {
  const record = asRecord(data);
  if (!record) return undefined;
  const createdEvent = asRecord(record.createdEvent);
  const entity = asRecord(record.entity);
  const createdEntity = asRecord(createdEvent?.entity);
  return firstString(
    record.entityId,
    record.id,
    entity?._id,
    entity?.id,
    createdEvent?.entityId,
    createdEvent?.id,
    createdEntity?._id,
    createdEntity?.id,
  );
}

function canonicalDescriptor(event: WixEvent, connectionId: string): CanonicalDescriptor {
  const providerEntityId = extractProviderEntityId(event.data);

  switch (event.eventType) {
    case "AppInstalled":
      return { eventType: "integration.connected.v1", entityType: "integration_connection", entityId: connectionId };
    case "AppRemoved":
      return { eventType: "integration.disconnected.v1", entityType: "integration_connection", entityId: connectionId };
    case "wix.ecom.v1.order_created":
      return { eventType: "order.created.v1", entityType: "order", entityId: providerEntityId };
    case "wix.contacts.v4.contact_created":
      return { eventType: "contact.created.v1", entityType: "contact", entityId: providerEntityId };
    case "wix.bookings.v2.booking_created":
      return { eventType: "booking.created.v1", entityType: "booking", entityId: providerEntityId };
    default:
      return {
        eventType: "integration.event_received.v1",
        entityType: "integration_connection",
        entityId: connectionId,
      };
  }
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("RINADS_WIX_EVENT_SINK_SECRET") ?? "";
  const providedSecret = req.headers.get("x-rinads-integration-secret") ?? "";
  if (!expectedSecret || !providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const providerHeader = req.headers.get("x-rinads-provider") ?? "";
  if (providerHeader.toLowerCase() !== "wix") {
    return json({ error: "Unsupported provider" }, 400);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const event = parseEvent(raw);
  if (!event) return json({ error: "Invalid Wix event" }, 422);

  const headerEventId = req.headers.get("x-rinads-event-id");
  if (headerEventId && headerEventId !== event.eventId) {
    return json({ error: "Event ID mismatch" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return json({ error: "Data plane not configured" }, 503);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    let { data: connection, error: connectionError } = await supabase
      .from("integration_connections")
      .select("id, organization_id, status, connected_at")
      .eq("provider", "wix")
      .eq("external_instance_id", event.instanceId)
      .maybeSingle();

    if (connectionError) throw connectionError;

    const now = new Date().toISOString();
    if (!connection) {
      const initialStatus = event.eventType === "AppRemoved" ? "removed" : "pending";
      const { data: inserted, error: insertConnectionError } = await supabase
        .from("integration_connections")
        .insert({
          provider: "wix",
          external_instance_id: event.instanceId,
          status: initialStatus,
          connected_at: event.eventType === "AppInstalled" ? now : null,
          removed_at: event.eventType === "AppRemoved" ? now : null,
          last_event_at: event.receivedAt,
          metadata: { discoveredBy: "wix-webhook" },
          updated_at: now,
        })
        .select("id, organization_id, status, connected_at")
        .single();

      if (insertConnectionError?.code === "23505") {
        const retry = await supabase
          .from("integration_connections")
          .select("id, organization_id, status, connected_at")
          .eq("provider", "wix")
          .eq("external_instance_id", event.instanceId)
          .single();
        if (retry.error) throw retry.error;
        connection = retry.data;
      } else if (insertConnectionError) {
        throw insertConnectionError;
      } else {
        connection = inserted;
      }
    }

    if (!connection) throw new Error("Unable to resolve Wix integration connection");

    const nextStatus = event.eventType === "AppRemoved"
      ? "removed"
      : event.eventType === "AppInstalled"
        ? (connection.organization_id ? "connected" : "pending")
        : connection.status;

    const connectionPatch: JsonRecord = {
      status: nextStatus,
      last_event_at: event.receivedAt,
      updated_at: now,
    };
    if (event.eventType === "AppInstalled") {
      connectionPatch.connected_at = connection.connected_at ?? now;
      connectionPatch.removed_at = null;
    }
    if (event.eventType === "AppRemoved") connectionPatch.removed_at = now;

    const { error: updateConnectionError } = await supabase
      .from("integration_connections")
      .update(connectionPatch)
      .eq("id", connection.id);
    if (updateConnectionError) throw updateConnectionError;

    const organizationId = connection.organization_id as string | null;
    const inboxStatus = organizationId ? "accepted" : "quarantined";
    const { error: inboxError } = await supabase.from("provider_event_inbox").insert({
      provider: "wix",
      event_id: event.eventId,
      event_type: event.eventType,
      external_instance_id: event.instanceId,
      connection_id: connection.id,
      organization_id: organizationId,
      status: inboxStatus,
      payload: event,
      received_at: event.receivedAt,
      processed_at: organizationId ? now : null,
    });

    if (inboxError?.code === "23505") {
      return json({ status: "duplicate", eventId: event.eventId });
    }
    if (inboxError) throw inboxError;

    if (!organizationId) {
      return json({
        status: "quarantined",
        eventId: event.eventId,
        reason: "Wix instance is not bound to a RINADS organization",
      }, 202);
    }

    const canonical = canonicalDescriptor(event, connection.id);
    const { error: businessEventError } = await supabase.from("business_events").insert({
      organization_id: organizationId,
      event_type: canonical.eventType,
      entity_type: canonical.entityType,
      entity_id: canonical.entityId ?? connection.id,
      payload: {
        provider: "wix",
        providerEventType: event.eventType,
        providerEntityId: canonical.entityId ?? null,
        externalInstanceId: event.instanceId,
        data: event.data,
      },
      metadata: {
        provider: "wix",
        providerEventId: event.eventId,
      },
      idempotency_key: `wix:${event.eventId}`,
      source: "wix",
      actor_type: "system",
      actor_id: "wix",
      schema_version: "v1",
    });

    if (businessEventError?.code !== "23505" && businessEventError) throw businessEventError;

    return json({
      status: "accepted",
      eventId: event.eventId,
      eventType: canonical.eventType,
    });
  } catch (error) {
    console.error("wix-event-sink", error);
    return json({ error: "Internal server error" }, 500);
  }
});
