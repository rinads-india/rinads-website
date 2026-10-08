import "server-only";

import { randomUUID } from "node:crypto";
import { OrderService, type CommerceContext, type Order } from "@rinads/commerce";
import {
  createSupabaseCommerceRepository,
  loadCommerceStoreFromSupabase,
  type CommerceSupabaseClient,
} from "@rinads/commerce-server";
import { commerce, demoContext } from "@/lib/commerce";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { getCommerceContextFromTenancy, isDemoMode } from "@/lib/tenancy";

export type OwnerOrderRuntime = {
  ctx: CommerceContext;
  orders: OrderService;
  persistOrder: (order: Order) => Promise<void>;
};

type PersistenceResult = Promise<{ error: { message: string } | null }>;
type OrderPersistenceClient = {
  from: (_table: string) => {
    upsert: (rows: Record<string, unknown>[]) => PersistenceResult;
    insert: (rows: Record<string, unknown>[]) => PersistenceResult;
  };
};

function throwIfError(error: { message: string } | null, operation: string): void {
  if (error) {
    throw new Error(`${operation}: ${error.message}`);
  }
}

async function persistOrderToSupabase(
  client: OrderPersistenceClient,
  organizationId: string,
  order: Order
): Promise<void> {
  const { error: orderError } = await client.from("orders").upsert([
    {
      id: order.id,
      organization_id: organizationId,
      customer_id: order.customerId ?? null,
      order_number: order.orderNumber,
      status: order.status,
      payment_status: order.paymentStatus,
      fulfilment_status: order.fulfilmentStatus,
      subtotal: order.subtotal,
      discount_total: order.discountTotal,
      shipping_total: order.shippingTotal,
      tax_total: order.taxTotal,
      grand_total: order.grandTotal,
      currency: order.currency,
      shipping_method_code: order.shippingMethodCode ?? null,
      promotion_code: order.promotionCode ?? null,
      guest_email: order.guestEmail ?? null,
      created_at: order.createdAt,
    },
  ]);
  throwIfError(orderError, "Failed to persist order status");

  const latestEvent = order.events[order.events.length - 1];
  if (latestEvent) {
    const { error: eventError } = await client.from("order_events").insert([
      {
        id: randomUUID(),
        order_id: order.id,
        event_type: latestEvent.eventType,
        label: latestEvent.label,
        occurred_at: latestEvent.occurredAt,
      },
    ]);
    throwIfError(eventError, "Failed to persist order timeline");
  }
}

export async function loadOwnerOrderRuntime(): Promise<OwnerOrderRuntime> {
  if (isDemoMode()) {
    return {
      ctx: demoContext(),
      orders: commerce.order,
      persistOrder: async () => undefined,
    };
  }

  const supabase = await createOwnerServerClient();
  const ctx = await getCommerceContextFromTenancy(async () => supabase);
  const commerceClient = supabase as unknown as CommerceSupabaseClient;
  const persistenceClient = supabase as unknown as OrderPersistenceClient;
  const store = await loadCommerceStoreFromSupabase(commerceClient, ctx.organizationId);

  if (!store) {
    throw new Error("Unable to load the active organization's commerce store.");
  }

  // Keep mutation state local to this request. Only the explicitly authorized
  // order + timeline records are persisted below; do not sync the full commerce store.
  const repo = createSupabaseCommerceRepository({
    organizationId: ctx.organizationId,
    initialStore: store,
  });

  return {
    ctx,
    orders: new OrderService(repo),
    persistOrder: (order) => persistOrderToSupabase(persistenceClient, ctx.organizationId, order),
  };
}
