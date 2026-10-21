import { isAvailable } from "@rinads/company-os-engine";
import { loadLogisticsDetail } from "@rinads/company-os-server";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, titleCase } from "@/lib/company-os/format";
import { s, sn } from "@/lib/company-os/rows";
import { getMoneyModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";
const EXCEPTION = /exception|fail|undeliver|rto|return|lost|damag/i;

export default async function LogisticsPage() {
  const g = await guard("/os/logistics", "commerce.order.read", "Logistics");
  if (!g.ok) return g.block;
  const { snapshot, session, now } = g.data;
  const detail = await loadLogisticsDetail(session.db, session.ctx);

  return (
    <OsPage title="Logistics" eyebrow="Fulfilment" summary="Order → shipment → carrier → tracking → exception → delivery → return, from the existing commerce records. Carrier integrations stay in the commerce portal; this view only reads.">
      <Panel id="pulse" title="Right now">
        <SectionGate section={snapshot.logistics} label="Logistics">
          {(l) => (
            <MetricGrid>
              <Metric label="In transit" value={l.active} />
              <Metric label="Exceptions / delayed" value={l.exceptions} tone={l.exceptions > 0 ? "warn" : undefined} hint="Delayed = shipped over 7 days ago and not delivered" />
              {isAvailable(detail.returns) && <Metric label="Return requests" value={detail.returns.data.length} />}
            </MetricGrid>
          )}
        </SectionGate>
      </Panel>
      <Panel id="shipments" title="Shipments">
        <SectionGate section={detail.shipments} label="Shipments">
          {(rows) => (
            <Table
              caption="Shipments"
              rows={rows}
              empty={<Empty title="No shipments" />}
              columns={[
                { header: "Carrier", cell: (r) => s(r, "carrier") },
                { header: "AWB", cell: (r) => (sn(r, "tracking_url") ? <a className="underline" href={s(r, "tracking_url")} rel="noopener noreferrer" target="_blank">{s(r, "awb") || "track"}</a> : (s(r, "awb") || "—")) },
                { header: "Status", cell: (r) => <Badge tone={EXCEPTION.test(s(r, "status")) ? "bad" : sn(r, "delivered_at") ? "good" : "neutral"}>{titleCase(s(r, "status"))}</Badge> },
                { header: "Shipped", cell: (r) => formatDate(sn(r, "shipped_at")) },
                { header: "Delivered", cell: (r) => formatDate(sn(r, "delivered_at")) },
                { header: "Age", cell: (r) => (sn(r, "shipped_at") && !sn(r, "delivered_at") ? `${Math.floor((now.getTime() - new Date(s(r, "shipped_at")).getTime()) / 86_400_000)}d in transit` : "—") },
              ]}
            />
          )}
        </SectionGate>
      </Panel>
      <Panel id="returns" title="Returns">
        <SectionGate section={detail.returns} label="Returns">
          {(rows) => <Table caption="Return requests" rows={rows} empty={<Empty title="No return requests" />} columns={[{ header: "Status", cell: (r) => <Badge>{titleCase(s(r, "status"))}</Badge> }, { header: "Reason", cell: (r) => s(r, "reason") }, { header: "Requested", cell: (r) => formatDate(s(r, "created_at")) }]} />}
        </SectionGate>
        <p className="mt-2 text-xs text-gray-500">Refunds are never processed from the Company OS; they stay in the commerce owner portal.</p>
      </Panel>
      <OsModuleBridge config={getMoneyModuleDestinations()} />
    </OsPage>
  );
}
