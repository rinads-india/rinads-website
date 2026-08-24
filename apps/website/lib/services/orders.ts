import { createWebsiteServerClient } from "@/lib/supabase/server";
import type { PublicOrderStatus } from "./types";

export async function getPublicOrderStatus(orderId: string): Promise<PublicOrderStatus | null> {
  const supabase = await createWebsiteServerClient();
  const { data, error } = await supabase.rpc("get_public_service_order_status", {
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

export async function createServiceOrder(input: {
  organizationId: string;
  serviceId: string;
  amount: number;
  requirements?: Record<string, unknown>;
}): Promise<{ orderId: string; orderNumber: string } | { error: string }> {
  const supabase = await createWebsiteServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  const { data, error } = await supabase
    .from("service_orders")
    .insert({
      organization_id: input.organizationId,
      service_id: input.serviceId,
      amount: input.amount,
      status: "pending",
      requirements: input.requirements ?? {},
      created_by: user.id,
    })
    .select("id, order_number")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create order" };
  return { orderId: String(data.id), orderNumber: String(data.order_number) };
}
