"use server";

import { SalonAutomationService, type SalonSupabaseClient } from "@rinads/salon-server";
import { redirect } from "next/navigation";
import { createRinaglowServerClient } from "@/lib/supabase/server";

export async function submitFeedbackAction(token: string, formData: FormData) {
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "");
  const client = await createRinaglowServerClient();
  const result = await new SalonAutomationService(client as unknown as SalonSupabaseClient)
    .submitFeedback(token, rating, comment);
  redirect(`/feedback/${token}?submitted=${result.ok && result.data.accepted ? "1" : "0"}`);
}

