import { createWebsiteServerClient } from "@/lib/supabase/server";
import type { PublicOrderStatus } from "./types";

export type ServiceOrderCheckoutRow = {
  id: string;
  organizationId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: string;
  razorpayOrderId: string | null;
};

export async function getPublicOrderStatus(orderId: string): Promise<PublicOrderStatus | null> {
  const supabase = await createWebsiteServerClient();
  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        fn: string,
        args: { p_order_id: string }
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    }
  ).rpc("get_public_service_order_status", {
    p_order_id: orderId,
  });

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    orderId: String(row.order_id),
    orderNumber: String(row.order_number),
    serviceName: String(row.service_name),
    pillar: String(row.pillar),
    status: String(row.status),
    progressPct: Number(row.progress_pct ?? 0),
    createdAt: String(row.created_at),
    dueDate: row.due_date ? String(row.due_date) : null,
    updatedAt: String(row.updated_at),
  };
}

/**
 * Loads the authoritative price for a service from the database.
 * NEVER trust a client-supplied amount for payment-relevant flows —
 * the client only ever selects which service to buy, never the price.
 */
async function getServicePriceForOrder(
  serviceId: string,
  organizationId: string
): Promise<{ basePrice: number; currency: string } | { error: string }> {
  const supabase = await createWebsiteServerClient();
  const { data, error } = await (
    supabase.from("services") as unknown as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{
            data: {
              organization_id: string | null;
              base_price: number | null;
              currency: string;
              pricing_model: string;
              is_active: boolean;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .select("organization_id, base_price, currency, pricing_model, is_active")
    .eq("id", serviceId)
    .single();

  if (error || !data) return { error: "Service not found" };
  if (!data.is_active) return { error: "This service is not currently available." };
  if (data.organization_id !== null && data.organization_id !== organizationId) {
    return { error: "Service not found" };
  }
  if (data.pricing_model !== "fixed" || data.base_price === null) {
    return { error: "This service requires a custom quote. Contact us to proceed." };
  }
  return { basePrice: Number(data.base_price), currency: data.currency };
}

export async function createServiceOrder(input: {
  organizationId: string;
  serviceId: string;
  requirements?: Record<string, unknown>;
}): Promise<{ orderId: string; orderNumber: string } | { error: string }> {
  const supabase = await createWebsiteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  const price = await getServicePriceForOrder(input.serviceId, input.organizationId);
  if ("error" in price) return { error: price.error };

  const { data, error } = await (
    supabase.from("service_orders") as unknown as {
      insert: (row: Record<string, unknown>) => {
        select: (cols: string) => {
          single: () => Promise<{
            data: { id: string; order_number: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    }
  )
    .insert({
      organization_id: input.organizationId,
      service_id: input.serviceId,
      amount: price.basePrice,
      currency: price.currency,
      status: "pending",
      requirements: input.requirements ?? {},
      created_by: user.id,
    })
    .select("id, order_number")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create order" };
  return { orderId: String(data.id), orderNumber: String(data.order_number) };
}

export async function getServiceOrderForCheckout(
  orderId: string,
  organizationId: string
): Promise<ServiceOrderCheckoutRow | null> {
  const supabase = await createWebsiteServerClient();
  const { data, error } = await (
    supabase.from("service_orders") as unknown as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          eq: (
            col: string,
            val: string
          ) => {
            single: () => Promise<{
              data: {
                id: string;
                organization_id: string;
                order_number: string;
                amount: number;
                currency: string;
                status: string;
                razorpay_order_id: string | null;
              } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .select("id, organization_id, order_number, amount, currency, status, razorpay_order_id")
    .eq("id", orderId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return null;

  return {
    id: String(data.id),
    organizationId: String(data.organization_id),
    orderNumber: String(data.order_number),
    amount: Number(data.amount),
    currency: String(data.currency ?? "INR"),
    status: String(data.status),
    razorpayOrderId: data.razorpay_order_id ? String(data.razorpay_order_id) : null,
  };
}

export async function updateServiceOrderRazorpayId(
  orderId: string,
  organizationId: string,
  razorpayOrderId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createWebsiteServerClient();
  const { error } = await (
    supabase.from("service_orders") as unknown as {
      update: (row: Record<string, unknown>) => {
        eq: (
          col: string,
          val: string
        ) => {
          eq: (
            col: string,
            val: string
          ) => Promise<{ error: { message: string } | null }>;
        };
      };
    }
  )
    .update({ razorpay_order_id: razorpayOrderId })
    .eq("id", orderId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  return { ok: true };
}
