import { getBusinessSummary } from "@rinads/salon-server";
import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Image from "next/image";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { PendingActionsList } from "./PendingActionsList";
import { LowRatingQueue } from "./LowRatingQueue";

export const metadata = { title: "Today — R GLOW Console" };

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

function formatDay(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}

function branchQuery(branchId?: string): string {
  return branchId ? `?branch=${encodeURIComponent(branchId)}` : "";
}

function statusLabel(status: string): string {
  if (status === "in_service") return "in chair";
  if (status === "checked_in") return "waiting";
  return status.replace("_", " ");
}

function MetricTile({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string | number;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </>
  );

  return href ? (
    <Link
      href={href}
      className="group rounded-2xl border border-rinads-primary/10 bg-surface p-4 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-rinads-primary/25 hover:shadow-md active:translate-y-0"
    >
      {content}
      <span className="mt-3 inline-flex text-xs font-semibold text-rinads-primary opacity-80 transition group-hover:opacity-100">
        Open →
      </span>
    </Link>
  ) : (
    <div className="rounded-2xl border border-rinads-primary/10 bg-surface p-4 shadow-sm">{content}</div>
  );
}

function PulseStat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-rinads-primary/10 bg-surface-muted/55 p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xl font-semibold text-rinads-primary">{value}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
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
  const canManageReviews =
    isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.reviews.manage");

  const [summary, pendingActionsResult, lowRatingResult, staffResult, customersResult, branchesResult] = await Promise.all([
    getBusinessSummary(repo, tenancy.organizationId, { branchId: branchFilter || undefined }),
    actions.listPending(tenancy.organizationId),
    repo.listLowRatingFollowUps(tenancy.organizationId),
    repo.listStaff(tenancy.organizationId),
    repo.listCustomers(tenancy.organizationId),
    repo.listBranches(tenancy.organizationId),
  ]);

  const pendingActions = pendingActionsResult.ok ? pendingActionsResult.data : [];
  const lowRatingItems = lowRatingResult.ok ? lowRatingResult.data : [];
  const staffById = new Map((staffResult.ok ? staffResult.data : []).map((s) => [s.id, s]));
  const customersById = new Map((customersResult.ok ? customersResult.data : []).map((c) => [c.id, c]));
  const branches = branchesResult.ok ? branchesResult.data : [];
  const selectedBranch = branchFilter ? branches.find((b) => b.id === branchFilter) : undefined;
  const storeLabel = selectedBranch?.name ?? "All stores";
  const q = branchQuery(summary.branchId);
  const now = new Date();

  const waitingCount = summary.todayAppointments.byStatus.checked_in ?? 0;
  const inChairCount = summary.todayAppointments.byStatus.in_service ?? 0;
  const completedCount = summary.todayAppointments.byStatus.completed ?? 0;
  const upcomingCount =
    (summary.todayAppointments.byStatus.pending ?? 0) + (summary.todayAppointments.byStatus.confirmed ?? 0);
  const averageUtilization = summary.staffUtilization.length
    ? Math.round(
        summary.staffUtilization.reduce((sum, row) => sum + row.utilizationPct, 0) / summary.staffUtilization.length
      )
    : 0;
  const sortedAppointments = [...summary.todayAppointments.appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const nextAppointment = sortedAppointments.find(
    (appt) =>
      !["completed", "cancelled", "no_show"].includes(appt.status) && new Date(appt.endsAt).getTime() >= now.getTime()
  );
  const nextCustomer = nextAppointment ? customersById.get(nextAppointment.customerId) : undefined;
  const nextStaff = nextAppointment ? staffById.get(nextAppointment.staffId) : undefined;
  const openLoops =
    summary.pendingPayments.count +
    summary.unconfirmedBookingCount +
    summary.reactivationCandidateCount +
    lowRatingItems.length +
    pendingActions.length;

  const brief = [
    `${summary.todayAppointments.total} appointment${summary.todayAppointments.total === 1 ? "" : "s"} today`,
    waitingCount ? `${waitingCount} waiting` : "no one waiting",
    inChairCount ? `${inChairCount} in chair` : "no active chair service",
    `${formatInr(summary.collectedToday.currency, summary.collectedToday.totalRevenue)} collected`,
    openLoops ? `${openLoops} open loop${openLoops === 1 ? "" : "s"} to review` : "no urgent open loops",
  ].join(", ");

  return (
    <div className="rg-page-enter space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-rinads-primary/15 bg-surface p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-rinads-primary/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rinads-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Today · live operations
              </span>
              <span className="text-xs font-medium text-muted-foreground">{storeLabel}</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">Today</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatDay(now, summary.timeZone)} · {summary.timeZone}</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/75 sm:text-base">
              One operating view for the front desk, money, staff capacity, client follow-up and RINPO actions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-md lg:justify-end">
            <Link href={`/calendar${q}`} className="btn-primary justify-center text-center">
              New booking
            </Link>
            <Link href={`/pos${q}`} className="btn-secondary justify-center text-center">
              Open POS
            </Link>
            <Link href={`/clients${q}`} className="btn-secondary justify-center text-center">
              Find client
            </Link>
            <Link href={`/campaigns${q}`} className="btn-secondary justify-center text-center">
              Follow-ups
            </Link>
          </div>
        </div>
      </section>

      <section className="rinpo-brief relative overflow-hidden">
        <Image
          src="/assets/rinpo-face.png"
          alt="RINPO"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-rinads-primary/20"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-foreground">RINPO daily brief</p>
            <span className="text-xs font-medium text-muted-foreground">· {storeLabel} · live</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-foreground">
            {greetingFor(now, summary.timeZone)}. {brief}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/calendar${q}`} className="chip-action">Run front desk</Link>
            <Link href={`/pos${q}`} className="chip-action">Collect payments</Link>
            <Link href={`/campaigns${q}`} className="chip-action">Recover clients</Link>
          </div>
        </div>
      </section>

      <section aria-label="Today overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Bookings today"
          value={summary.todayAppointments.total}
          detail={`${completedCount} done · ${inChairCount} in chair · ${waitingCount} waiting`}
          href={`/calendar${q}`}
        />
        <MetricTile
          label="Revenue today"
          value={formatInr(summary.collectedToday.currency, summary.collectedToday.totalRevenue)}
          detail={`${summary.collectedToday.saleCount} paid sale${summary.collectedToday.saleCount === 1 ? "" : "s"} today`}
          href={`/pos${q}`}
        />
        <MetricTile
          label="Collected"
          value={summary.collectedToday.saleCount}
          detail={`${formatInr(summary.collectedToday.currency, summary.collectedToday.totalRevenue)} across paid invoices`}
          href={`/pos${q}`}
        />
        <MetricTile
          label="Open loops"
          value={openLoops}
          detail={`${summary.pendingPayments.count} payments · ${summary.unconfirmedBookingCount} confirmations · ${summary.reactivationCandidateCount} quiet clients`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rinads-primary">Front desk now</p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">Chair & queue pulse</h3>
            </div>
            <Link href={`/calendar${q}`} className="text-xs font-semibold text-rinads-primary">Open calendar →</Link>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <PulseStat label="Waiting" value={waitingCount} detail="Checked in and ready" />
            <PulseStat label="In chair" value={inChairCount} detail="Service currently active" />
            <PulseStat label="Upcoming" value={upcomingCount} detail="Pending + confirmed" />
          </div>

          <div className="mt-4 rounded-2xl border border-rinads-primary/10 bg-rinads-primary/[0.045] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Next on the board</p>
            {nextAppointment ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {formatTime(nextAppointment.startsAt, summary.timeZone)} · {nextCustomer?.name ?? nextCustomer?.phone ?? "Walk-in"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {nextStaff?.displayName ?? "Unassigned"} · {statusLabel(nextAppointment.status)}
                  </p>
                </div>
                <Badge className={STATUS_TONE[nextAppointment.status] ?? "bg-gray-200 text-gray-700"}>
                  {statusLabel(nextAppointment.status)}
                </Badge>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No active appointment is waiting on the board.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rinads-primary">Money & growth</p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">Open opportunities</h3>
            </div>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{openLoops} open</span>
          </div>
          <div className="mt-4 divide-y divide-rinads-primary/10">
            <Link href={`/pos${q}`} className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <div>
                <p className="text-sm font-semibold text-foreground">Pending payments</p>
                <p className="text-xs text-muted-foreground">Recover outstanding tickets</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{summary.pendingPayments.count}</p>
                <p className="text-xs text-rinads-primary">{formatInr(summary.pendingPayments.currency, summary.pendingPayments.totalOutstanding)}</p>
              </div>
            </Link>
            <Link href={`/campaigns${q}`} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Quiet clients</p>
                <p className="text-xs text-muted-foreground">Eligible for reactivation</p>
              </div>
              <p className="text-lg font-semibold text-foreground">{summary.reactivationCandidateCount}</p>
            </Link>
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Low-rating follow-ups</p>
                <p className="text-xs text-muted-foreground">Service recovery queue</p>
              </div>
              <p className="text-lg font-semibold text-foreground">{lowRatingItems.length}</p>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-foreground">RINPO approvals</p>
                <p className="text-xs text-muted-foreground">Sensitive actions awaiting review</p>
              </div>
              <p className="text-lg font-semibold text-foreground">{pendingActions.length}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Today&rsquo;s schedule</p>
              <p className="mt-1 text-xs text-muted-foreground">Chronological front-desk view</p>
            </div>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {summary.todayAppointments.total} total
            </span>
          </div>
          {sortedAppointments.length === 0 ? (
            <EmptyState
              title="No appointments today"
              description="When bookings land they show up here with check-in actions on the calendar."
              action={<Link href={`/calendar${q}`} className="btn-secondary">Open calendar</Link>}
            />
          ) : (
            <ul className="mt-3 divide-y divide-rinads-primary/10">
              {sortedAppointments.map((appt) => {
                const customer = customersById.get(appt.customerId);
                const staff = staffById.get(appt.staffId);
                return (
                  <li key={appt.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {formatTime(appt.startsAt, summary.timeZone)} · {customer?.name ?? customer?.phone ?? "Walk-in"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{staff?.displayName ?? "Unassigned"}</p>
                    </div>
                    <Badge className={STATUS_TONE[appt.status] ?? "bg-gray-200 text-gray-700"}>{statusLabel(appt.status)}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Staff today</p>
              <p className="mt-1 text-xs text-muted-foreground">Booked capacity across active staff</p>
            </div>
            <span className="rounded-full bg-rinads-primary/10 px-2.5 py-1 text-xs font-semibold text-rinads-primary">
              {averageUtilization}% avg
            </span>
          </div>
          {summary.staffUtilization.length === 0 ? (
            <EmptyState title="No active staff" description="Add stylists in Staff to see utilization for today." />
          ) : (
            <ul className="mt-4 space-y-4">
              {summary.staffUtilization.map((row) => (
                <li key={row.staffId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-foreground">{row.staffName}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{row.utilizationPct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-rinads-primary transition-[width] duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, row.utilizationPct))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {row.bookedMinutes} booked min · {row.availableMinutes} available min
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/staff${q}`} className="mt-4 inline-flex text-xs font-semibold text-rinads-primary">Manage staff →</Link>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINADS Intelligence</p>
            <p className="section-title mt-1">What needs attention</p>
          </div>
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {summary.attentionItems.length} ranked signal{summary.attentionItems.length === 1 ? "" : "s"}
          </span>
        </div>
        {summary.attentionItems.length === 0 ? (
          <EmptyState title="Nothing urgent" description="No signals are ranked right now — check back after today’s bookings come in." />
        ) : (
          <ol className="mt-4 grid gap-2 lg:grid-cols-2">
            {summary.attentionItems.map((item, i) => (
              <li key={item.kind} className="rounded-2xl border border-rinads-primary/10 bg-surface-muted/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rinads-primary/10 px-1.5 text-xs font-bold text-rinads-primary">{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  <Badge className={IMPACT_TONE}>score {Math.round(item.score)}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        )}
        <p className="rbac-note mt-4">
          Ask RINPO &ldquo;What needs attention?&rdquo; then &ldquo;Do the first three&rdquo;. Sensitive actions remain approval-gated.
        </p>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">Low-rating follow-up</p>
              <p className="mt-1 text-xs text-muted-foreground">Close the loop with unhappy clients</p>
            </div>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{lowRatingItems.length}</span>
          </div>
          <div className="mt-3">
            <LowRatingQueue items={lowRatingItems} canManage={canManageReviews} />
          </div>
          {!lowRatingResult.ok ? <p className="mt-2 text-sm text-danger">{lowRatingResult.error.message}</p> : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-title">RINPO approvals</p>
              <p className="mt-1 text-xs text-muted-foreground">Governed actions that require a human decision</p>
            </div>
            <Link href={`/pos${q}`} className="text-xs font-semibold text-rinads-primary">POS →</Link>
          </div>
          {canApprove ? (
            <div className="mt-3"><PendingActionsList actions={pendingActions} /></div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {pendingActions.length} sensitive action(s) are waiting on an admin&rsquo;s approval.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
