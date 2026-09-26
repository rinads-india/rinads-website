"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@rinads/commerce";
import { commerce, demoContext } from "@/lib/commerce";

export type UpdateOrderStatusState = {
  ok: boolean;
  message?: string;
};

export async function updateOrderStatus(
  _prev: UpdateOrderStatusState,
  formData: FormData
): Promise<UpdateOrderStatusState> {
  const ctx = demoContext();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const label = String(formData.get("label") ?? `Status updated to ${status}`);

  const result = commerce.order.updateStatus(ctx, orderId, status, label);
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/");

  return { ok: true, message: "Order status updated." };
}
