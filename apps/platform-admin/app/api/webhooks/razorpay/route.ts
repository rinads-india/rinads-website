import { NextResponse } from "next/server";
import { processRazorpayWebhook, getRazorpayConfigFromEnv } from "@rinads/billing";
import { createPlatformServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const config = getRazorpayConfigFromEnv();
  if (!config) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const service = createPlatformServiceClient();

  const result = await processRazorpayWebhook(service as never, {
    rawBody,
    signature,
    webhookSecret: config.webhookSecret,
    resolveOrganizationId: async (payload) => {
      const subId = (payload.payload as Record<string, unknown>)?.subscription as { id?: string } | undefined;
      if (!subId?.id) return null;
      const { data } = await (
        service as unknown as {
          from: (table: string) => {
            select: (cols: string) => {
              eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: null }>;
            };
          };
        }
      )
        .from("billing_subscriptions")
        .select("organization_id")
        .eq("provider_subscription_id", subId.id);
      return data?.[0]?.organization_id ? String(data[0].organization_id) : null;
    },
    resolvePlanKey: async () => "growth",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false });
}
