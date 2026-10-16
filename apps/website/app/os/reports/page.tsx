import { isAvailable } from "@rinads/company-os";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, Metric, MetricGrid, Notes, OsPage, Panel, Table } from "@/components/os/company/ui";
import { formatMoney, titleCase } from "@/lib/company-os/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
const fmt = (v: number | null, money = false) => (v === null ? "Unavailable" : money ? formatMoney(v) : v);

export default async function ReportsPage() {
  const g = await guard("/os/reports", "reports.read", "Reports");
  if (!g.ok) return g.block;
  const { snapshot, notes } = g.data;
  const dc = snapshot.dailyClose;

  return (
    <OsPage title="Reports" eyebrow="Review" summary="The daily close and tomorrow's priorities, computed from permitted records only. A figure that cannot be computed shows as Unavailable rather than zero.">
      <Notes notes={notes} />
      <Panel id="close" title={`Daily close — ${dc.day}`} subtitle="India calendar day">
        <MetricGrid>
          <Metric label="Tasks completed" value={fmt(dc.tasksCompleted)} />
          <Metric label="Tasks created" value={fmt(dc.tasksCreated)} />
          <Metric label="Carried over" value={fmt(dc.tasksCarriedOver)} />
          <Metric label="Leads received" value={fmt(dc.leadsReceived)} />
          <Metric label="Invoices issued" value={fmt(dc.invoicesIssued)} />
          <Metric label="Payments received" value={fmt(dc.paymentsReceivedAmount, true)} />
          <Metric label="Deals advanced" value={fmt(dc.opportunitiesAdvanced)} />
          <Metric label="Approvals still pending" value={fmt(dc.approvalsStillPending)} />
        </MetricGrid>
        {dc.unavailable.length > 0 && <p className="mt-3 text-xs text-gray-500">Could not be computed: {dc.unavailable.join(", ")}.</p>}
      </Panel>
      <Panel id="tomorrow" title="Tomorrow's priorities">
        <Table
          caption="Tomorrow's priorities"
          rows={snapshot.tomorrowPriorities}
          empty={<Empty title="Nothing scheduled for tomorrow" hint="Only dated work, expiring proposals, due invoices and open decisions are listed." />}
          columns={[
            { header: "Type", cell: (p) => <Badge>{titleCase(p.kind)}</Badge> },
            { header: "Item", cell: (p) => <Link className="font-semibold hover:underline" href={p.href}>{p.title}</Link> },
            { header: "Detail", cell: (p) => p.detail },
          ]}
        />
      </Panel>
      {isAvailable(snapshot.pipeline) && (
        <Panel id="pipeline" title="Pipeline basis" subtitle={snapshot.pipeline.data.basis}>
          <MetricGrid>
            <Metric label="Open deals" value={snapshot.pipeline.data.openCount} />
            <Metric label="Weighted value" value={formatMoney(snapshot.pipeline.data.weightedValue)} />
          </MetricGrid>
        </Panel>
      )}
    </OsPage>
  );
}
