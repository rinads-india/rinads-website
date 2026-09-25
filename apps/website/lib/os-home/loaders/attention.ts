import type { PermissionKey, RoleKey } from "@rinads/permissions";
import type { AttentionItem } from "@/lib/os-home/types";
import { capabilityTierFromRoleKey, tierAtLeast } from "@/lib/os-org-role";

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

  try {
    const { count, error } = await input.client
      .from("operational_tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .in("status", ["todo", "in_progress", "blocked"])
      .lte("due_at", dueIso);
    if (!error && (count ?? 0) > 0) {
      items.push({
        id: "live-tasks-due",
        type: "task_due",
        label: "Tasks due today",
        count: count ?? 0,
        href: "/os/work/tasks",
        severity: (count ?? 0) >= 5 ? "critical" : "attention",
        source: "live",
      });
    }
  } catch {
    // skip
  }

  try {
    const { count, error } = await input.client
      .from("operational_alerts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .eq("acknowledged", false);
    if (!error && (count ?? 0) > 0) {
      items.push({
        id: "live-alerts",
        type: "alert",
        label: "Operational alerts",
        count: count ?? 0,
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
      const { count, error } = await input.client
        .from("runtime_approvals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", input.organizationId)
        .eq("status", "pending");
      if (!error && (count ?? 0) > 0) {
        items.push({
          id: "live-approvals",
          type: "approval",
          label: "Approvals waiting",
          count: count ?? 0,
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
      const { count, error } = await input.client
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", input.organizationId)
        .in("status", [
          "pending",
          "confirmed",
          "processing",
          "awaiting_payment",
        ]);
      if (!error && (count ?? 0) > 0) {
        items.push({
          id: "live-orders",
          type: "order_attention",
          label: "Open orders",
          count: count ?? 0,
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
