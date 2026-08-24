"use server";

import { revalidatePath } from "next/cache";
import { createServiceOrder } from "@/lib/services/orders";
import { resolveWebsiteTenancy } from "@/lib/tenancy";

export async function createServiceOrderAction(serviceId: string, amount: number) {
  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) {
    return { ok: false as const, error: "Sign in and complete onboarding to order services." };
  }

  const result = await createServiceOrder({
    organizationId: tenancy.organizationId,
    serviceId,
    amount,
  });

  if ("error" in result) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/services");
  return { ok: true as const, orderId: result.orderId, orderNumber: result.orderNumber };
}
