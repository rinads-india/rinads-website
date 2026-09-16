import type { CommunicationStatus } from "@rinads/salon-server";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export const metadata = { title: "Communications — R GLOW Console" };

const FILTERS: Array<{ label: string; value?: CommunicationStatus }> = [
  { label: "All" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Sent", value: "sent" },
  { label: "Delivered", value: "delivered" },
  { label: "Read", value: "read" },
  { label: "Failed", value: "failed" },
  { label: "Dead letter", value: "dead_letter" },
  { label: "Not configured", value: "not_configured" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const query = await searchParams;
  const tenancy = await requireTenancy();
  const canView =
    ["founder", "super_admin"].includes(tenancy.roleKey ?? "") ||
    tenancy.permissions.includes("salon.communications.view") ||
    tenancy.permissions.includes("salon.communications.retry");
  if (!canView) return <Card><p className="text-sm text-danger">You do not have permission to view communications.</p></Card>;

  const page = Math.max(1, Number(query.page ?? 1));
  const status = FILTERS.find((filter) => filter.value === query.status)?.value;
  const { communications } = await getSalonDeps();
  const result = await communications.list(tenancy.organizationId, {
    page,
    pageSize: 25,
    statuses: status ? [status] : undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Communications</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tenant-scoped outbound delivery log. The outbox is the source of truth.</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Communication status filters">
        {FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/communications?status=${filter.value}` : "/communications"}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${status === filter.value ? "bg-rinads-primary text-white" : "bg-surface-muted text-foreground"}`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      <Card>
        {!result.ok ? (
          <p className="text-sm text-danger">{result.error.message}</p>
        ) : result.data.rows.length === 0 ? (
          <EmptyState title="No communications" description="No messages match this status filter." />
        ) : (
          <>
            <ul className="divide-y divide-rinads-primary/10">
              {result.data.rows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/communications/${row.id}`} className="font-medium text-foreground hover:underline">
                      {row.recipient}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.channel} · {row.templateKey} · {new Date(row.createdAt).toLocaleString()}</p>
                    {row.lastError ? <p className="mt-1 max-w-2xl truncate text-xs text-danger">{row.lastError}</p> : null}
                  </div>
                  <Badge>{row.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link className="text-rinads-primary underline" href={`?${status ? `status=${status}&` : ""}page=${page - 1}`}>← Previous</Link> : <span />}
              <span className="text-muted-foreground">{result.data.total} total</span>
              {result.data.hasMore ? <Link className="text-rinads-primary underline" href={`?${status ? `status=${status}&` : ""}page=${page + 1}`}>Next →</Link> : <span />}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
