import type { RecentEntity } from "@/lib/os-home/types";

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Recently updated";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Recently updated";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `Updated ${hours}h ago`;
  return `Updated ${Math.round(hours / 24)}d ago`;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

/**
 * Continue Working — recent tasks/orders as labeled proxies.
 * Empty when nothing is readable (honest empty, not fabricated projects).
 */
export async function loadLiveContinueWorking(input: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  organizationId: string;
}): Promise<RecentEntity[]> {
  const entities: RecentEntity[] = [];

  try {
    const { data, error } = await input.client
      .from("operational_tasks")
      .select("id, title, status, updated_at, due_at")
      .eq("organization_id", input.organizationId)
      .in("status", ["todo", "in_progress", "blocked"])
      .order("updated_at", { ascending: false })
      .limit(5);
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        entities.push({
          id: `task-${row.id}`,
          name: String(row.title),
          entityType: "task",
          entityTypeLabel: "Task",
          subtitle: `${statusLabel(String(row.status))} · ${relativeTime(row.updated_at as string | null)}`,
          href: "/os/work/tasks",
          source: "live",
        });
      }
    }
  } catch {
    // skip
  }

  try {
    const { data, error } = await input.client
      .from("orders")
      .select("id, status, created_at, order_number")
      .eq("organization_id", input.organizationId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const id = String(row.id);
        entities.push({
          id: `order-${id}`,
          name: row.order_number ? `Order ${row.order_number}` : `Order ${id.slice(0, 8)}`,
          entityType: "order",
          entityTypeLabel: "Order",
          subtitle: `${statusLabel(String(row.status))} · ${relativeTime(row.created_at as string | null)}`,
          href: "/os/money",
          source: "live",
        });
      }
    }
  } catch {
    // skip
  }

  return entities.slice(0, 6);
}
