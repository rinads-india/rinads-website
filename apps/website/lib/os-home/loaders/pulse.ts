import type { PermissionKey, RoleKey } from "@rinads/permissions";
import type { PulseMetric } from "@/lib/os-home/types";
import { capabilityTierFromRoleKey, tierAtLeast } from "@/lib/os-org-role";

/**
 * Live pulse metrics with evidence only. Never invents revenue/pipeline/receivables.
 */
export async function loadLivePulseMetrics(input: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  organizationId: string;
  roleKey: RoleKey | null;
  permissions: PermissionKey[];
}): Promise<PulseMetric[]> {
  const metrics: PulseMetric[] = [];
  const tier = capabilityTierFromRoleKey(input.roleKey);
  const canReadOrders =
    input.permissions.includes("commerce.order.read") ||
    input.permissions.includes("commerce.order.manage") ||
    (tier !== null && tierAtLeast(tier, "staff"));

  if (canReadOrders) {
    try {
      const { count, error } = await input.client
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", input.organizationId)
        .in("status", [
          "pending",
          "confirmed",
          "processing",
          "awaiting_payment",
          "fulfilled",
          "shipped",
        ]);
      if (!error && count !== null) {
        metrics.push({
          id: "live-orders",
          label: "Orders",
          value: String(count),
          timeframe: "Open & recent statuses",
          source: "live",
          href: "/os/money",
        });
      }
    } catch {
      // hide
    }
  }

  try {
    const { count, error } = await input.client
      .from("operational_tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .in("status", ["todo", "in_progress", "blocked"]);
    if (!error && count !== null) {
      metrics.push({
        id: "live-open-tasks",
        label: "Open tasks",
        value: String(count),
        timeframe: "Current backlog",
        source: "live",
        href: "/os/work",
      });
    }
  } catch {
    // hide
  }

  return metrics;
}
