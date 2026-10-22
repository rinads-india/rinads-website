import { timingSafeEqual } from "node:crypto";
import type { DeliveryEventType } from "@rinads/operations";

export type ShiprocketNormalizedWebhook = {
  awb: string;
  courierName?: string;
  merchantOrderId?: string;
  providerOrderId?: string;
  providerStatusId?: number;
  providerStatus?: string;
  providerTimestamp?: string;
  event: {
    type: DeliveryEventType;
    label: string;
    occurredAt: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function statusToEvent(statusId: number | undefined, label: string | undefined): DeliveryEventType {
  if (statusId === 7 || statusId === 26) return "delivered";
  if (statusId === 17 || statusId === 41) return "out_for_delivery";
  if (statusId === 42) return "picked_up";
  if (statusId === 9 || statusId === 10 || statusId === 14 || statusId === 40 || statusId === 46 || statusId === 78) {
    return "returned";
  }
  if (
    statusId === 8 ||
    statusId === 12 ||
    statusId === 13 ||
    statusId === 16 ||
    statusId === 20 ||
    statusId === 21 ||
    statusId === 24 ||
    statusId === 25 ||
    statusId === 39 ||
    statusId === 44 ||
    statusId === 45 ||
    statusId === 47 ||
    statusId === 71 ||
    statusId === 72 ||
    statusId === 75 ||
    statusId === 76 ||
    statusId === 77
  ) {
    return "failed";
  }
  if (statusId === 1 || statusId === 2 || statusId === 3 || statusId === 4 || statusId === 5 || statusId === 27) {
    return "label_created";
  }
  if (statusId === 6 || statusId === 18 || statusId === 19 || (statusId !== undefined && statusId >= 38)) {
    return "in_transit";
  }

  const normalized = label?.toLowerCase() ?? "";
  if (normalized.includes("out for delivery")) return "out_for_delivery";
  if (normalized.includes("deliver")) return "delivered";
  if (normalized.includes("picked")) return "picked_up";
  if (normalized.includes("rto") || normalized.includes("return")) return "returned";
  if (normalized.includes("cancel") || normalized.includes("fail") || normalized.includes("lost")) return "failed";
  if (normalized.includes("transit") || normalized.includes("shipped")) return "in_transit";
  return "label_created";
}

function safeOccurredAt(providerTimestamp: string | undefined, receivedAt: string): string {
  if (!providerTimestamp) return receivedAt;
  const parsed = Date.parse(providerTimestamp);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : receivedAt;
}

export function verifyShiprocketWebhookKey(
  provided: string | null | undefined,
  expected: string
): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided ?? "", "utf8");
  if (expectedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function shiprocketWebhookEventKey(event: ShiprocketNormalizedWebhook): string {
  const status = event.providerStatusId ?? event.providerStatus ?? event.event.type;
  const providerTime = event.providerTimestamp ?? "no-provider-time";
  return `shiprocket:${event.awb}:${status}:${providerTime}`;
}

export function normalizeShiprocketWebhook(
  payload: unknown,
  receivedAt = new Date().toISOString()
): ShiprocketNormalizedWebhook {
  const root = asRecord(payload);
  if (!root) throw new Error("Shiprocket webhook payload must be a JSON object.");

  const awb = text(root.awb);
  if (!awb) throw new Error("Shiprocket webhook payload is missing awb.");

  const providerStatusId = num(root.shipment_status_id) ?? num(root.current_status_id);
  const providerStatus = text(root.shipment_status) ?? text(root.current_status);
  const providerTimestamp = text(root.current_timestamp);
  const label = providerStatus ?? "Shiprocket tracking update";

  return {
    awb,
    courierName: text(root.courier_name),
    merchantOrderId: text(root.order_id),
    providerOrderId:
      root.sr_order_id === undefined ? undefined : String(root.sr_order_id),
    providerStatusId,
    providerStatus,
    providerTimestamp,
    event: {
      type: statusToEvent(providerStatusId, providerStatus),
      label,
      occurredAt: safeOccurredAt(providerTimestamp, receivedAt),
    },
  };
}

function activityToEvent(activity: unknown, fallbackAt: string): {
  type: DeliveryEventType;
  label: string;
  occurredAt: string;
} | null {
  const row = asRecord(activity);
  if (!row) return null;
  const statusId = num(row["sr-status"]) ?? num(row.sr_status) ?? num(row.status_code);
  const label =
    text(row["sr-status-label"]) ??
    text(row.sr_status_label) ??
    text(row.activity) ??
    text(row.status);
  if (!label && statusId === undefined) return null;
  const providerAt = text(row.date) ?? text(row.activity_date) ?? text(row.timestamp);
  return {
    type: statusToEvent(statusId, label),
    label: label ?? `Shiprocket status ${statusId}`,
    occurredAt: safeOccurredAt(providerAt, fallbackAt),
  };
}

export function normalizeShiprocketTrackingResponse(
  payload: unknown,
  receivedAt = new Date().toISOString()
): { type: DeliveryEventType; label: string; occurredAt: string }[] {
  const root = asRecord(payload);
  if (!root) return [];
  const trackingData = asRecord(root.tracking_data) ?? root;
  const candidates = [
    trackingData.shipment_track_activities,
    trackingData.scans,
    root.scans,
  ].find(Array.isArray);

  const events = Array.isArray(candidates)
    ? candidates
        .map((activity) => activityToEvent(activity, receivedAt))
        .filter((event): event is NonNullable<typeof event> => event !== null)
    : [];

  if (events.length > 0) return events;

  const current = asRecord(trackingData.shipment_track);
  const statusId = num(current?.current_status_id) ?? num(current?.shipment_status_id);
  const label = text(current?.current_status) ?? text(current?.shipment_status);
  if (statusId === undefined && !label) return [];

  return [
    {
      type: statusToEvent(statusId, label),
      label: label ?? `Shiprocket status ${statusId}`,
      occurredAt: safeOccurredAt(text(current?.current_timestamp), receivedAt),
    },
  ];
}
