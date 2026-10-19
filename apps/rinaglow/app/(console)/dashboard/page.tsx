import { getBusinessSummary } from "@rinads/salon-server";
import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Image from "next/image";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { PendingActionsList } from "./PendingActionsList";
import { LowRatingQueue } from "./LowRatingQueue";

export const metadata = { title: "Dashboard — R GLOW Console" };

const IMPACT_TONE = "bg-rose-100 text-rose-800";
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-purple-100 text-purple-800",
  in_service: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-200 text-gray-600",
  no_show: "bg-red-100 text-red-700",
};

function formatInr(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

function greetingFor(now: Date, timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(now)
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone, hour: "2-digit", minute: "2-digit" });
}

function branchQuery(branchId?: string): string {
  return branchId ? `?branch=${encodeURIComponent(branchId)}` : "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const tenancy = await requireTenancy();
  const { repo, actions } = await getSalonDeps();
  const { branch: branchFilter } = await searchParams;
  const canApprove = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("org.manage");
  const canManageReviews = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.reviews.manage");

  const [summary, pendingActionsResult, lowRatingResult, staffResult, customersResult, branchesResult] = await Promise.all([
    getBusinessSummary(repo, tenancy.organizationId, { branchId: branchFilter || undefined }),
    actions.listPending(tenancy.organizationId),
    repo.listLowRatingFollowUps(tenancy.organizationId),
    repo.listStaff(tenancy.organizationId),
    repo.listCustomers(tenancy.organizationId),
    repo.listBranches(tenancy.organizationId),
  ]);

  const pendingActions = pendingActionsResult.ok ? pendingActionsResult.data : [];
  const staffById = new Map((staffResult.ok ? staffResult.data : []).map((s) => [s.id, s]));
  const customersById = new Map((customersResult.ok ? customersResult.data : []).map((c) => [c.id, c]));
  const branches = branchesResult.ok ? branchesResult.data : [];
  const selectedBranch = branchFilter ? branches.find((b) => b.id === branchFilter) : undefined;
  const storeLabel = selectedBranch?.name ?? "every store";
  const q = branchQuery(summary.branchId);
  const now = new Date();

  const brief = [
    `${summary.todayAppointments.total} appointment${summary.todayAppointments.total === 1 ? "" : "s"} on the board`,
    `${formatInr(summary.collectedToday.currency, summary.collectedToday.totalRevenue)} collected from ${summary.collectedToday.saleCount} paid sale${summary.collectedToday.saleCount === 1 ? "" : "s"}`,
    summary.pendingPayments.count
      ? `${summary.pendingPayments.count} payment${summary.pendingPayments.count === 1 ? "" : "s"} still outstanding`
      : "no outstanding tickets",
    summary.reactivationCandidateCount
      ? `${summary.reactivationCandidateCount} client${summary.reactivationCandidateCount === 1 ? "" : "s"} going quiet`
      : "no quiet clients to chase",
  ].join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What needs attention right now — the same signals RINPO uses when you ask it
          {selectedBranch ? ` · ${selectedBranch.name}` : " · all stores"}.
        </p>
      </div>

      <div className="rinpo-brief">
        <Image
          src="/assets/rinpo-face.png"
          alt="RINPO"
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            RINPO says <span className="font-medium text-muted-foreground">· {storeLabel} · just now</span>
          </p>
          <p className="mt-1 text-sm text-foreground">
            {greetingFor(now, summary.timeZone)}. {brief}. Want me to take the first three?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/calendar${q}`} className="chip-action">
              Open today&rsquo;s calendar
            </Link>
            <Link href={`/pos${q}`} className="chip-action">
              Collect payments
            </Link>
            <Link href={`/campaigns${q}`} className="chip-action">
              Follow-ups
            </Link>
          </div>
        </div>
      </div>

      <div className="today-checkin-banner flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">Today · front office</p>
          <p className="mt-1 text-sm text-foreground">
            <span className="font-semibold">{summary.todayAppointments.total}</span> appointment
            {summary.todayAppointments.total === 1 ? "" : "s"} on the board — open the calendar to confirm and check in.
          </p>
        </div>
        <Link href={`/calendar${q}`} className="btn-primary">
          Open today&rsquo;s calendar
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bookings today</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.todayAppointments.total}</p>
          <p className="text-xs text-muted-foreground">
            {summary.todayAppointments.byStatus.completed ?? 0} done · {summary.todayAppointments.byStatus.in_service ?? 0} in chair
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Revenue today</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatInr(summary.collectedToday.currency, summary.collectedToday.totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground">Paid POS sales on this calendar day</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Collected</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.collectedToday.saleCount}</p>
          <p className="text-xs text-muted-foreground">
            {formatInr(summary.collectedToday.currency, summary.collectedToday.totalRevenue)} across paid invoices
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending payments</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{summary.pendingPayments.count}</p>
          <p className="text-xs text-muted-foreground">
            {formatInr(summary.pendingPayments.currency, summary.pendingPayments.totalOutstanding)} outstanding
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="section-title">Today&rsquo;s schedule</p>
          {summary.todayAppointments.appointments.length === 0 ? (
            <EmptyState
              title="No appointments today"
              description="When bookings land they show up here with check-in actions on the calendar."
              action={
                <Link href={`/calendar${q}`} className="btn-secondary">
                  Open calendar
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-rinads-primary/10">
              {summary.todayAppointments.appointments.map((appt) => {
                const customer = customersById.get(appt.customerId);
                const staff = staffById.get(appt.staffId);
                return (
                  <li key={appt.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatTime(appt.startsAt, summary.timeZone)} · {customer?.name ?? customer?.phone ?? "Walk-in"}
                      </p>
                      <p className="text-xs text-muted-foreground">{staff?.displayName ?? "Unassigned"}</p>
                    </div>
                    <Badge className={STATUS_TONE[appt.status] ?? "bg-gray-200 text-gray-700"}>
                      {appt.status === "in_service" ? "in chair" : appt.status === "checked_in" ? "waiting" : appt.status.replace("_", " ")}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <p className="section-title">Staff today</p>
          {summary.staffUtilization.length === 0 ? (
            <EmptyState title="No active staff" description="Add stylists in Staff to see utilization for today." />
          ) : (
            <ul className="space-y-3">
              {summary.staffUtilization.map((row) => (
                <li key={row.staffId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{row.staffName}</span>
                    <span className="text-xs text-muted-foreground">{row.utilizationPct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-rinads-primary"
                      style={{ width: `${Math.min(100, Math.max(0, row.utilizationPct))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
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
        <p className="section-title">Low-rating follow-up</p>
        <LowRatingQueue items={lowRatingResult.ok ? lowRatingResult.data : []} canManage={canManageReviews} />
        {!lowRatingResult.ok ? <p className="mt-2 text-sm text-danger">{lowRatingResult.error.message}</p> : null}
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
