import { isPrivilegedRoleKey } from "@rinads/permissions";
import type { AppointmentStatus, SalonAppointment } from "@rinads/salon";
import { getBusinessSummary } from "@rinads/salon-server";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { AppointmentActions } from "../calendar/AppointmentActions";
import { NewAppointmentForm } from "../calendar/NewAppointmentForm";
import { SaleCard } from "../pos/SaleCard";
import { StartSaleButton } from "../pos/StartSaleButton";

export const metadata = { title: "Front Desk — R GLOW Console" };

const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-purple-100 text-purple-800",
  in_service: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-200 text-gray-600",
  no_show: "bg-red-100 text-red-700",
};

function formatTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function localDateTimeValue(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const minute = Math.ceil(Number(value.minute ?? 0) / 15) * 15;
  const rounded = new Date(date.getTime() + ((minute === 60 ? 60 : minute) - Number(value.minute ?? 0)) * 60_000);
  const roundedParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(rounded);
  const p = Object.fromEntries(roundedParts.map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function branchQuery(branchId?: string): string {
  return branchId ? `?branch=${encodeURIComponent(branchId)}` : "";
}

function calendarAppointmentHref(date: string, appointmentId: string, branchId?: string): string {
  const params = new URLSearchParams({ view: "day", date, appointment: appointmentId });
  if (branchId) params.set("branch", branchId);
  return `/calendar?${params.toString()}`;
}

function stageLabel(status: AppointmentStatus): string {
  if (status === "checked_in") return "Waiting";
  if (status === "in_service") return "In chair";
  if (status === "pending") return "Needs confirmation";
  return status.replace("_", " ");
}

function QueueAppointment({
  appointment,
  timeZone,
  customerLabel,
  customerHref,
  staffLabel,
  saleExists,
  date,
  branchId,
}: {
  appointment: SalonAppointment;
  timeZone: string;
  customerLabel: string;
  customerHref?: string;
  staffLabel: string;
  saleExists: boolean;
  date: string;
  branchId?: string;
}) {
  return (
    <li className="rounded-2xl border border-rinads-primary/10 bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">{formatTime(appointment.startsAt, timeZone)}</span>
            <Badge className={STATUS_TONE[appointment.status]}>{stageLabel(appointment.status)}</Badge>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {customerHref ? (
              <Link href={customerHref} className="text-rinads-primary underline underline-offset-2">
                {customerLabel}
              </Link>
            ) : (
              customerLabel
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{staffLabel}</p>
        </div>
        <Link
          href={calendarAppointmentHref(date, appointment.id, branchId)}
          className="text-xs font-semibold text-rinads-primary underline underline-offset-2"
        >
          Details / RINPO
        </Link>
      </div>

      <div className="mt-3 border-t border-rinads-primary/10 pt-3">
        {appointment.status === "completed" ? (
          saleExists ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Checkout already opened
            </span>
          ) : (
            <StartSaleButton appointmentId={appointment.id} />
          )
        ) : (
          <AppointmentActions appointmentId={appointment.id} status={appointment.status} />
        )}
      </div>
    </li>
  );
}

export default async function FrontDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const tenancy = await requireTenancy();
  const { branch: branchFilter } = await searchParams;
  const { repo, loyalty, automations } = await getSalonDeps();
  const canOverridePricing =
    isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.pricing.override");

  const [
    summary,
    branchesResult,
    staffResult,
    servicesResult,
    customersResult,
    draftSalesResult,
    awaitingSalesResult,
    paidSalesResult,
    reviewRulesResult,
    reviewSummaryResult,
  ] = await Promise.all([
    getBusinessSummary(repo, tenancy.organizationId, { branchId: branchFilter || undefined }),
    repo.listBranches(tenancy.organizationId),
    repo.listStaff(tenancy.organizationId),
    repo.listServices(tenancy.organizationId),
    repo.listCustomers(tenancy.organizationId),
    repo.listSales(tenancy.organizationId, { status: "draft", branchId: branchFilter || undefined }),
    repo.listSales(tenancy.organizationId, { status: "awaiting_payment", branchId: branchFilter || undefined }),
    repo.listSales(tenancy.organizationId, { status: "paid", branchId: branchFilter || undefined }),
    automations.automation.listRules(tenancy.organizationId),
    automations.automation.getReviewSummary(tenancy.organizationId),
  ]);

  const branches = branchesResult.ok ? branchesResult.data : [];
  const selectedBranch = branchFilter ? branches.find((branch) => branch.id === branchFilter) : undefined;
  const activeBranches = branches.filter((branch) => branch.isActive);
  const activeStaff = (staffResult.ok ? staffResult.data : []).filter((member) => member.isActive);
  const activeServices = (servicesResult.ok ? servicesResult.data : []).filter((service) => service.isActive);
  const customersById = new Map((customersResult.ok ? customersResult.data : []).map((customer) => [customer.id, customer]));
  const staffById = new Map(activeStaff.map((member) => [member.id, member]));
  const timeZone = selectedBranch?.timezone ?? summary.timeZone;
  const q = branchQuery(summary.branchId);

  const appointments = [...summary.todayAppointments.appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const appointmentIds = new Set(appointments.map((appointment) => appointment.id));
  const draftSales = draftSalesResult.ok ? draftSalesResult.data : [];
  const awaitingSales = awaitingSalesResult.ok ? awaitingSalesResult.data : [];
  const paidSales = paidSalesResult.ok ? paidSalesResult.data : [];
  const saleAppointmentIds = new Set(
    [...draftSales, ...awaitingSales, ...paidSales].map((sale) => sale.appointmentId).filter(Boolean)
  );

  const arrivals = appointments.filter((appointment) => appointment.status === "pending" || appointment.status === "confirmed");
  const waiting = appointments.filter((appointment) => appointment.status === "checked_in");
  const inChair = appointments.filter((appointment) => appointment.status === "in_service");
  const readyForCheckout = appointments.filter(
    (appointment) => appointment.status === "completed" && !saleAppointmentIds.has(appointment.id)
  );
  const exceptions = appointments.filter((appointment) => appointment.status === "cancelled" || appointment.status === "no_show");

  const openSaleSummaries = [...draftSales, ...awaitingSales];
  const openSaleResults = await Promise.all(openSaleSummaries.map((sale) => repo.getSale(sale.id)));
  const openSales = openSaleResults.flatMap((result) => (result.ok ? [result.data] : []));
  const loyaltyBalances = new Map<string, number>();
  for (const sale of openSales) {
    if (sale.customerId && !loyaltyBalances.has(sale.customerId)) {
      const balance = await loyalty.getBalance(tenancy.organizationId, sale.customerId);
      loyaltyBalances.set(sale.customerId, balance.ok ? balance.data : 0);
    }
  }

  const paidToday = paidSales.filter((sale) => !sale.appointmentId || appointmentIds.has(sale.appointmentId));
  const reviewRule = reviewRulesResult.ok
    ? reviewRulesResult.data.find((rule) => rule.kind === "review_request")
    : undefined;
  const reviewSummary = reviewSummaryResult.ok ? reviewSummaryResult.data : undefined;
  const now = new Date();
  const nextAppointment = appointments.find(
    (appointment) =>
      !["completed", "cancelled", "no_show"].includes(appointment.status) &&
      new Date(appointment.endsAt).getTime() >= now.getTime()
  );

  const queueSections = [
    { key: "arrivals", title: "Arrivals", subtitle: "Confirm and check in", items: arrivals },
    { key: "waiting", title: "Waiting", subtitle: "Checked in and ready", items: waiting },
    { key: "chair", title: "In chair", subtitle: "Services underway", items: inChair },
    { key: "checkout", title: "Ready for checkout", subtitle: "Complete visit and collect", items: readyForCheckout },
  ];

  return (
    <div className="rg-page-enter space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-rinads-primary/15 bg-surface p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rinads-primary/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rinads-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Front Desk v3 · live workflow
              </span>
              <span className="text-xs font-medium text-muted-foreground">{selectedBranch?.name ?? "All stores"}</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">Run the salon from one queue.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75 sm:text-base">
              Arrival → check-in → chair → complete → checkout → payment → loyalty → review automation, using the same governed appointment and POS engines already in R GLOW.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link href={`/calendar${q}`} className="btn-secondary">Full calendar</Link>
            <Link href={`/pos${q}`} className="btn-secondary">Full POS</Link>
          </div>
        </div>
      </section>

      <section aria-label="Front desk pulse" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Arrivals", arrivals.length, "pending / confirmed"],
          ["Waiting", waiting.length, "checked in"],
          ["In chair", inChair.length, "service active"],
          ["Checkout", readyForCheckout.length, "needs sale"],
          ["Open sales", openSales.length, "draft / payment"],
        ].map(([label, value, detail]) => (
          <div key={String(label)} className="rounded-2xl border border-rinads-primary/10 bg-surface p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </section>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Next operational focus</p>
            {nextAppointment ? (
              <>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatTime(nextAppointment.startsAt, timeZone)} · {customersById.get(nextAppointment.customerId)?.name ?? customersById.get(nextAppointment.customerId)?.phone ?? "Walk-in"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stageLabel(nextAppointment.status)} · {staffById.get(nextAppointment.staffId)?.displayName ?? "Unassigned"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No active appointment is waiting for the front desk right now.</p>
            )}
          </div>
          {nextAppointment ? (
            <AppointmentActions appointmentId={nextAppointment.id} status={nextAppointment.status} />
          ) : null}
        </div>
      </Card>

      <NewAppointmentForm
        branches={activeBranches}
        services={activeServices}
        staff={activeStaff}
        defaultStartsAtLocal={localDateTimeValue(now, timeZone)}
        defaultBranchId={selectedBranch?.id}
      />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Run the queue</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">One workflow, no module hopping</h3>
          </div>
          <p className="text-xs text-muted-foreground">Appointment state changes are validated by the existing salon state machine.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {queueSections.map((section) => (
            <Card key={section.key}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-title">{section.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{section.subtitle}</p>
                </div>
                <span className="rounded-full bg-rinads-primary/10 px-2.5 py-1 text-xs font-semibold text-rinads-primary">
                  {section.items.length}
                </span>
              </div>
              {section.items.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nothing in this stage.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {section.items.map((appointment) => {
                    const customer = customersById.get(appointment.customerId);
                    const staff = staffById.get(appointment.staffId);
                    return (
                      <QueueAppointment
                        key={appointment.id}
                        appointment={appointment}
                        timeZone={timeZone}
                        customerLabel={customer?.name ?? customer?.phone ?? "Walk-in customer"}
                        customerHref={customer ? `/clients/${customer.id}` : undefined}
                        staffLabel={staff?.displayName ?? "Unassigned staff"}
                        saleExists={saleAppointmentIds.has(appointment.id)}
                        date={summary.todayAppointments.date}
                        branchId={summary.branchId}
                      />
                    );
                  })}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Checkout desk</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Invoice, loyalty and payment in place</h3>
          </div>
          <Link href={`/pos${q}`} className="text-xs font-semibold text-rinads-primary underline underline-offset-2">Open full POS</Link>
        </div>

        {openSales.length === 0 ? (
          <Card>
            <EmptyState title="No checkout in progress" description="Complete a visit and choose Start checkout. The sale will appear here." />
          </Card>
        ) : (
          <div className="space-y-3">
            {openSales.map((sale) => (
              <Card key={sale.id}>
                <SaleCard
                  sale={sale}
                  customerLabel={
                    (sale.customerId && (customersById.get(sale.customerId)?.name ?? customersById.get(sale.customerId)?.phone)) ??
                    "Walk-in customer"
                  }
                  canOverridePricing={canOverridePricing}
                  loyaltyBalance={sale.customerId ? loyaltyBalances.get(sale.customerId) : 0}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Post-visit automation</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">Paid → loyalty → review follow-up</h3>
            </div>
            <Badge className={reviewRule?.enabled === false ? "bg-gray-200 text-gray-700" : "bg-emerald-100 text-emerald-800"}>
              {reviewRule?.enabled === false ? "Review automation off" : "Review automation on"}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-xs text-muted-foreground">Paid visits today</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{paidToday.length}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-xs text-muted-foreground">Review delay</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{reviewRule?.delayMinutes ?? 120}m</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-xs text-muted-foreground">Pending reviews</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{reviewSummary?.pending ?? 0}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Completed visits are eligible for the existing review-request automation. RINPO can also schedule a review request for a selected completed appointment under the salon review permission.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/communications" className="chip-action">Communications</Link>
            <Link href="/loyalty" className="chip-action">Loyalty</Link>
            <Link href="/campaigns" className="chip-action">Follow-ups</Link>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Exceptions</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Cancelled / no-show today</h3>
          {exceptions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No exceptions today.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {exceptions.map((appointment) => (
                <li key={appointment.id} className="flex items-center justify-between gap-3 rounded-xl border border-rinads-primary/10 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatTime(appointment.startsAt, timeZone)} · {customersById.get(appointment.customerId)?.name ?? "Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">{stageLabel(appointment.status)}</p>
                  </div>
                  <Link
                    href={calendarAppointmentHref(summary.todayAppointments.date, appointment.id, summary.branchId)}
                    className="text-xs font-semibold text-rinads-primary underline underline-offset-2"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
