import "server-only";

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

function throwIfError(error: { message: string } | null, operation: string): void {
  if (error) {
    throw new Error(`${operation}: ${error.message}`);
  }
}

async function persistOrderToSupabase(
  client: CommerceSupabaseClient,
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

  if (order.events.length > 0) {
    const { error: eventsError } = await client.from("order_events").upsert(
      order.events.map((event) => ({
        id: event.id,
        order_id: order.id,
        event_type: event.eventType,
        label: event.label,
        occurred_at: event.occurredAt,
      }))
    );
    throwIfError(eventsError, "Failed to persist order timeline");
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
  const client = supabase as unknown as CommerceSupabaseClient;
  const store = await loadCommerceStoreFromSupabase(client, ctx.organizationId);

  if (!store) {
    throw new Error("Unable to load the active organization's commerce store.");
  }

  const repo = createSupabaseCommerceRepository({
    organizationId: ctx.organizationId,
    client,
    initialStore: store,
  });

  return {
    ctx,
    orders: new OrderService(repo),
    persistOrder: (order) => persistOrderToSupabase(client, ctx.organizationId, order),
  };
}
