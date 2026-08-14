"use server";

import { revalidatePath } from "next/cache";
import { commerce, DEMO_CUSTOMER_ID, portalContext } from "@/lib/commerce";

export async function createSupportTicket(formData: FormData) {
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "").trim() || undefined;
  const category = String(formData.get("category") ?? "general").trim();

  if (!subject || !body) {
    return { ok: false as const, message: "Subject and message are required." };
  }

  const ctx = portalContext();
  const result = commerce.support.create(ctx, {
    customerId: DEMO_CUSTOMER_ID,
    subject,
    body,
    orderId,
    category,
    authorType: "customer",
  });

  if (!result.ok) {
    return { ok: false as const, message: result.error.message };
  }

  revalidatePath("/support");
  return { ok: true as const, ticketId: result.data.id };
}
