import type { PermissionKey, RoleKey } from "@rinads/permissions";
import type { AttentionItem } from "@/lib/os-home/types";
import { capabilityTierFromRoleKey, tierAtLeast } from "@/lib/os-org-role";

type CountClient = {
  from: (table: string) => {
    select: (columns: string, opts?: { count?: "exact"; head?: boolean }) => unknown;
  };
};

async function runCount(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Live attention items from RLS-readable tables only.
 * Unsupported CRM/invoice/project types are never fabricated.
 */
export async function loadLiveAttentionItems(input: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  organizationId: string;
  roleKey: RoleKey | null;
  permissions: PermissionKey[];
}): Promise<AttentionItem[]> {
  const tier = capabilityTierFromRoleKey(input.roleKey);
  const items: AttentionItem[] = [];
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const dueIso = endOfDay.toISOString();
  const client = input.client as CountClient;

  try {
    const tasksDue = await runCount(
      client
        .from("operational_tasks")
        .select("id", { count: "exact", head: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq("organization_id", input.organizationId)
        .in("status", ["todo", "in_progress", "blocked"])
        .lte("due_at", dueIso) as PromiseLike<{ count: number | null; error: { message: string } | null }>
    );
    if (tasksDue > 0) {
      items.push({
        id: "live-tasks-due",
        type: "task_due",
        label: "Tasks due today",
        count: tasksDue,
        href: "/os/work/tasks",
        severity: tasksDue >= 5 ? "critical" : "attention",
        source: "live",
      });
    }
  } catch {
    // skip
  }

  try {
    const alerts = await runCount(
      client
        .from("operational_alerts")
        .select("id", { count: "exact", head: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq("organization_id", input.organizationId)
        .eq("acknowledged", false) as PromiseLike<{ count: number | null; error: { message: string } | null }>
    );
    if (alerts > 0) {
      items.push({
        id: "live-alerts",
        type: "alert",
        label: "Operational alerts",
        count: alerts,
        href: "/os/work",
        severity: "attention",
        source: "live",
      });
    }
  } catch {
    // skip
  }

  if (tier && tierAtLeast(tier, "staff")) {
    try {
      const approvals = await runCount(
        client
          .from("runtime_approvals")
          .select("id", { count: "exact", head: true })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq("organization_id", input.organizationId)
          .eq("status", "pending") as PromiseLike<{ count: number | null; error: { message: string } | null }>
      );
      if (approvals > 0) {
        items.push({
          id: "live-approvals",
          type: "approval",
          label: "Approvals waiting",
          count: approvals,
          href: "/os/automate",
          severity: "neutral",
          source: "live",
        });
      }
    } catch {
      // skip
    }
  }

  const canOrders =
    input.permissions.includes("commerce.order.read") ||
    input.permissions.includes("commerce.order.manage") ||
    (tier !== null && tierAtLeast(tier, "staff"));

  if (canOrders) {
    try {
      const openOrders = await runCount(
        client
          .from("orders")
          .select("id", { count: "exact", head: true })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq("organization_id", input.organizationId)
          .in("status", [
            "pending",
            "confirmed",
            "processing",
            "awaiting_payment",
          ]) as PromiseLike<{ count: number | null; error: { message: string } | null }>
      );
      if (openOrders > 0) {
        items.push({
          id: "live-orders",
          type: "order_attention",
          label: "Open orders",
          count: openOrders,
          href: "/os/money",
          severity: "neutral",
          source: "live",
        });
      }
    } catch {
      // skip
    }
  }

  return items;
}
