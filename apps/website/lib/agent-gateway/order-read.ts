import type { RinadsAgentPrincipal } from "./principal";
import {
  appendRinadsAgentReadAudit,
  authorizeRinadsAgentRead,
} from "./read-policy";

export const AGENT_ORDER_READ_FLAG = "agent.commerce.order.read" as const;
export const AGENT_ORDER_READ_PERMISSION = "commerce.order.read" as const;

export type RinadsOrderReadResult =
  | { ok: true; data: Record<string, unknown> }
  | {
      ok: false;
      status: "invalid" | "forbidden" | "disabled" | "not_found" | "unavailable";
      reason: string;
    };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function parseRinadsOrderReadInput(value: unknown):
  | { ok: true; orderId: string }
  | { ok: false; reason: string } {
  const input = asRecord(value);
  if (!input) return { ok: false, reason: "Order input must be an object." };

  const allowedKeys = new Set(["order_id"]);
  const unsupportedKey = Object.keys(input).find((key) => !allowedKeys.has(key));
  if (unsupportedKey) {
    return { ok: false, reason: `Unsupported order argument: ${unsupportedKey}.` };
  }

  const orderId = text(input.order_id);
  if (!orderId) return { ok: false, reason: "order_id is required." };
  if (orderId.length > 128) return { ok: false, reason: "order_id is too long." };
  if (!UUID_PATTERN.test(orderId)) return { ok: false, reason: "order_id must be a valid UUID." };

  return { ok: true, orderId };
}

export async function executeRinadsOrderRead(input: {
  request: Request;
  principal: RinadsAgentPrincipal;
  arguments?: unknown;
}): Promise<RinadsOrderReadResult> {
  const parsed = parseRinadsOrderReadInput(input.arguments);
  if (!parsed.ok) return { ok: false, status: "invalid", reason: parsed.reason };

  const policy = await authorizeRinadsAgentRead({
    request: input.request,
    principal: input.principal,
    permission: AGENT_ORDER_READ_PERMISSION,
    entitlementFlag: AGENT_ORDER_READ_FLAG,
  });
  if (!policy.ok) return policy;

  const { data: orderRow, error: orderError } = await policy.client
    .from("orders")
    .select(
      "id,order_number,status,payment_status,fulfilment_status,subtotal,discount_total,shipping_total,tax_total,grand_total,currency,shipping_method_code,promotion_code,created_at,updated_at"
    )
    .eq("organization_id", input.principal.organizationId)
    .eq("id", parsed.orderId)
    .maybeSingle();

  if (orderError) {
    return { ok: false, status: "unavailable", reason: "Tenant-scoped order could not be read." };
  }
  if (!orderRow) {
    return { ok: false, status: "not_found", reason: "Order not found." };
  }

  const order = orderRow as Record<string, unknown>;
  const { data: lineRows, error: lineError } = await policy.client
    .from("order_lines")
    .select("id,variant_id,product_name,variant_name,sku,quantity,unit_price,tax_amount,discount_amount")
    .eq("order_id", parsed.orderId)
    .order("id", { ascending: true });

  if (lineError) {
    return { ok: false, status: "unavailable", reason: "Tenant-scoped order lines could not be read." };
  }

  const { data: eventRows, error: eventError } = await policy.client
    .from("order_events")
    .select("event_type,label,occurred_at")
    .eq("order_id", parsed.orderId)
    .order("occurred_at", { ascending: true });

  if (eventError) {
    return { ok: false, status: "unavailable", reason: "Tenant-scoped order events could not be read." };
  }

  const lines = (lineRows ?? []).map((row) => row as Record<string, unknown>);
  const events = (eventRows ?? []).map((row) => row as Record<string, unknown>);

  const audit = await appendRinadsAgentReadAudit({
    client: policy.client,
    request: input.request,
    principal: input.principal,
    action: "commerce.order.read",
    entity: "order",
    entityId: parsed.orderId,
    metadata: {
      line_count: lines.length,
      event_count: events.length,
    },
  });
  if (!audit.ok) {
    return { ok: false, status: "unavailable", reason: audit.reason };
  }

  return {
    ok: true,
    data: {
      capability: "commerce.order.read",
      order: {
        id: text(order.id) ?? parsed.orderId,
        orderNumber: text(order.order_number) ?? "",
        status: text(order.status) ?? "",
        paymentStatus: text(order.payment_status) ?? "",
        fulfilmentStatus: text(order.fulfilment_status) ?? "",
        subtotal: numberValue(order.subtotal) ?? 0,
        discountTotal: numberValue(order.discount_total) ?? 0,
        shippingTotal: numberValue(order.shipping_total) ?? 0,
        taxTotal: numberValue(order.tax_total) ?? 0,
        grandTotal: numberValue(order.grand_total) ?? 0,
        currency: text(order.currency) ?? "INR",
        shippingMethodCode: text(order.shipping_method_code) ?? null,
        promotionCode: text(order.promotion_code) ?? null,
        createdAt: text(order.created_at) ?? null,
        updatedAt: text(order.updated_at) ?? null,
        lines: lines.map((line) => ({
          id: text(line.id) ?? "",
          variantId: text(line.variant_id) ?? null,
          productName: text(line.product_name) ?? "",
          variantName: text(line.variant_name) ?? "",
          sku: text(line.sku) ?? "",
          quantity: numberValue(line.quantity) ?? 0,
          unitPrice: numberValue(line.unit_price) ?? 0,
          taxAmount: numberValue(line.tax_amount) ?? 0,
          discountAmount: numberValue(line.discount_amount) ?? 0,
        })),
        events: events.map((event) => ({
          type: text(event.event_type) ?? "",
          label: text(event.label) ?? "",
          occurredAt: text(event.occurred_at) ?? null,
        })),
      },
    },
  };
}
