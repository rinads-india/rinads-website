"use server";

import { getUsageValue, type PlanLimits } from "@rinads/billing";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { requirePlatformTenancy } from "@/lib/tenancy";
import { isDemoMode } from "@/lib/supabase/env";
import { listPlansAction } from "./tenants";

export async function getTenantBillingAction(organizationId: string): Promise<
  | {
      ok: true;
      subscription: { planKey: string; status: string } | null;
      usage: { ordersThisMonth: number; seats: number };
      limits: PlanLimits;
    }
  | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();

    if (isDemoMode()) {
      return {
        ok: true,
        subscription: { planKey: "growth", status: "active" },
        usage: { ordersThisMonth: 12, seats: 3 },
        limits: { modules: ["commerce", "inventory", "procurement", "fulfilment"], ordersPerMonth: 1000, seats: 25 },
      };
    }

    const service = createPlatformServiceClient();
    const { data: sub } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("organization_subscriptions")
      .select("plan_key, status")
      .eq("organization_id", organizationId);

    const plans = await listPlansAction();
    const planKey = sub?.[0]?.plan_key ? String(sub[0].plan_key) : "starter";
    const planLimits =
      plans.ok && plans.plans.find((p) => p.key === planKey)?.limits
        ? (plans.plans.find((p) => p.key === planKey)!.limits as PlanLimits)
        : { ordersPerMonth: 100, seats: 5 };

    const { data: usageRows } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("usage_counters")
      .select("metric_key, value, period_start")
      .eq("organization_id", organizationId);

    const counters = (usageRows ?? []).map((row) => ({
      organizationId,
      metricKey: String(row.metric_key),
      periodStart: String(row.period_start),
      value: Number(row.value),
    }));

    return {
      ok: true,
      subscription: sub?.[0]
        ? { planKey: String(sub[0].plan_key), status: String(sub[0].status) }
        : null,
      usage: {
        ordersThisMonth: getUsageValue(counters, organizationId, "orders/month"),
        seats: getUsageValue(counters, organizationId, "seats"),
      },
      limits: planLimits,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function listBillingEventsAction(): Promise<
  | { ok: true; events: { id: string; eventType: string; organizationId?: string; processedAt: string }[] }
  | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();
    if (isDemoMode()) {
      return {
        ok: true,
        events: [
          {
            id: "evt_demo",
            eventType: "subscription.activated",
            organizationId: "org_ambady_demo",
            processedAt: new Date().toISOString(),
          },
        ],
      };
    }
    const service = createPlatformServiceClient();
    const { data, error } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
        };
      }
    ).from("billing_events").select("id, event_type, organization_id, processed_at");

    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      events: (data ?? []).map((row) => ({
        id: String(row.id),
        eventType: String(row.event_type),
        organizationId: row.organization_id ? String(row.organization_id) : undefined,
        processedAt: String(row.processed_at),
      })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
