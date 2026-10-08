"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@rinads/commerce";
import { loadOwnerOrderRuntime } from "@/lib/order-runtime";

export type UpdateOrderStatusState = {
  ok: boolean;
  message?: string;
};

const ALLOWED_STATUSES = new Set<OrderStatus>([
  "placed",
  "confirmed",
  "cancelled",
  "return_requested",
  "returned",
  "refund_pending",
  "refunded",
  "delivery_failed",
]);

export async function updateOrderStatus(
  _prev: UpdateOrderStatusState,
  formData: FormData
): Promise<UpdateOrderStatusState> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as OrderStatus;
  const rawLabel = String(formData.get("label") ?? "").trim();

  if (!orderId) {
    return { ok: false, message: "Order ID is required." };
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return { ok: false, message: "Invalid order status." };
  }

  const label = (rawLabel || `Status updated to ${status}`).slice(0, 200);

  try {
    const { ctx, orders: orderService, persistOrder } = await loadOwnerOrderRuntime();
    const result = orderService.updateStatus(ctx, orderId, status, label);
    if (!result.ok) {
      return { ok: false, message: result.error.message };
    }

    await persistOrder(result.data);

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/");

    return { ok: true, message: "Order status updated." };
  } catch (error) {
    console.error("Failed to update order status", error);
    return { ok: false, message: "Unable to update the order right now." };
  }
}
