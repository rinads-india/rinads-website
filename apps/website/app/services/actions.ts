"use server";

import { revalidatePath } from "next/cache";
import {
  createRazorpayOrder,
  getRazorpayCheckoutConfigFromEnv,
  rupeesToPaise,
} from "@rinads/billing";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import {
  createServiceOrder,
  getServiceOrderForCheckout,
  updateServiceOrderRazorpayId,
} from "@/lib/services/orders";
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

export async function createRazorpayCheckoutSessionAction(orderId: string): Promise<
  | {
      ok: true;
      keyId: string;
      razorpayOrderId: string;
      amountPaise: number;
      orderId: string;
      orderNumber: string;
      prefill: { email?: string; name?: string };
    }
  | { ok: false; error: string }
> {
  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) {
    return { ok: false, error: "Sign in and complete onboarding to pay for services." };
  }

  const order = await getServiceOrderForCheckout(orderId, tenancy.organizationId);
  if (!order) {
    return { ok: false, error: "Order not found" };
  }
  if (order.status !== "pending") {
    return { ok: false, error: "This order is no longer awaiting payment." };
  }

  const config = getRazorpayCheckoutConfigFromEnv();
  if (!config) {
    return { ok: false, error: "Razorpay is not configured on this environment." };
  }

  let razorpayOrderId = order.razorpayOrderId;
  if (!razorpayOrderId) {
    const amountPaise = rupeesToPaise(order.amount);
    const created = await createRazorpayOrder({
      config,
      amountPaise,
      receipt: order.orderNumber,
      notes: {
        service_order_id: order.id,
        organization_id: order.organizationId,
      },
    });
    if ("error" in created) {
      return { ok: false, error: created.error };
    }
    razorpayOrderId = created.id;
    const saved = await updateServiceOrderRazorpayId(order.id, order.organizationId, razorpayOrderId);
    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }
  }

  const supabase = await createWebsiteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    ok: true,
    keyId: config.keyId,
    razorpayOrderId,
    amountPaise: rupeesToPaise(order.amount),
    orderId: order.id,
    orderNumber: order.orderNumber,
    prefill: {
      email: user?.email ?? undefined,
      name: user?.user_metadata?.full_name ? String(user.user_metadata.full_name) : undefined,
    },
  };
}

export async function getPublicOrderStatusAction(orderId: string) {
  const { getPublicOrderStatus } = await import("@/lib/services/orders");
  const order = await getPublicOrderStatus(orderId);
  if (!order) return { ok: false as const };
  return { ok: true as const, order };
}
