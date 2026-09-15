import { getBusinessSummary } from "@rinads/salon-server";
import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { PendingActionsList } from "./PendingActionsList";

export const metadata = { title: "Dashboard — R GLOW Console" };

const IMPACT_TONE = "bg-rose-100 text-rose-800";

export default async function DashboardPage() {
  const tenancy = await requireTenancy();
  const { repo, actions } = await getSalonDeps();
  const canApprove = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("org.manage");

  const [summary, pendingActionsResult] = await Promise.all([
    getBusinessSummary(repo, tenancy.organizationId),
    actions.listPending(tenancy.organizationId),
  ]);

  const pendingActions = pendingActionsResult.ok ? pendingActionsResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What needs attention right now — the same signals RINPO uses when you ask it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.todayAppointments.total}</p>
          <p className="text-xs text-muted-foreground">appointment(s)</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending payments</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.pendingPayments.count}</p>
          <p className="text-xs text-muted-foreground">
            {summary.pendingPayments.currency} {summary.pendingPayments.totalOutstanding.toLocaleString("en-IN")} outstanding
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reactivation candidates</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.reactivationCandidateCount}</p>
          <p className="text-xs text-muted-foreground">customers going quiet</p>
        </Card>
      </div>

      <Card>
        <p className="section-title">What needs attention</p>
        {summary.attentionItems.length === 0 ? (
          <EmptyState title="Nothing urgent" description="No signals are ranked right now — check back after today's bookings come in." />
        ) : (
          <ol className="mt-3 space-y-2">
            {summary.attentionItems.map((item, i) => (
              <li key={item.kind} className="flex items-start justify-between gap-3 rounded-xl border border-rinads-primary/10 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <Badge className={IMPACT_TONE}>score {Math.round(item.score)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="rbac-note mt-3">
          Ask RINPO (bottom of the screen) &ldquo;What needs attention?&rdquo; then &ldquo;Do the first three&rdquo; to act on this
          list directly.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="section-title">RINPO approvals</p>
          <Link href="/pos" className="text-xs font-medium text-rinads-primary underline">
            Refund requests are in POS →
          </Link>
        </div>
        {canApprove ? (
          <div className="mt-3">
            <PendingActionsList actions={pendingActions} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {pendingActions.length} sensitive action(s) are waiting on an admin&rsquo;s approval.
          </p>
        )}
      </Card>
    </div>
  );
}
