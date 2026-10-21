import { isAvailable } from "@rinads/company-os-engine";
import { loadLogisticsDetail } from "@rinads/company-os-server";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { guard } from "@/components/os/company/guard";
import { Metric, MetricGrid, OsPage, Panel, SectionGate } from "@/components/os/company/ui";
import { formatMoney } from "@/lib/company-os/format";
import { n, s } from "@/lib/company-os/rows";
import { getMoneyModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";

export default async function CommercePage() {
  const g = await guard("/os/commerce", null, "Commerce", { business: <OsModuleBridge config={getMoneyModuleDestinations()} /> });
  if (!g.ok) return g.block;
  const { session } = g.data;
  const canRead = session.ctx.permissions.includes("commerce.order.read") || ["founder", "super_admin", "admin"].includes(session.ctx.roleKey ?? "");
  const detail = canRead ? await loadLogisticsDetail(session.db, session.ctx) : null;

  return (
    <OsPage title="Commerce" eyebrow="Revenue" summary="Orders and storefront operations live in the existing commerce portals, which keep their own inventory authority and refund controls. This page reads the shared records and links out; it never duplicates them.">
      {detail && (
        <Panel id="orders" title="Recent orders" subtitle="Read-only from the commerce order records">
          <SectionGate section={detail.orders} label="Orders">
            {(rows) => {
              const total = rows.reduce((a, r) => a + (n(r, "total_amount") ?? n(r, "total") ?? 0), 0);
              return (
                <MetricGrid>
                  <Metric label="Orders (latest 100)" value={rows.length} />
                  <Metric label="Value of those orders" value={formatMoney(total)} hint="Order value, not recognised revenue" />
                  <Metric label="Open orders" value={rows.filter((r) => !["delivered", "completed", "cancelled", "refunded"].includes(s(r, "status"))).length} />
                </MetricGrid>
              );
            }}
          </SectionGate>
          {isAvailable(detail.orders) && detail.orders.data.length === 0 && <p className="mt-2 text-xs text-gray-500">No orders in this organisation.</p>}
        </Panel>
      )}
      <OsModuleBridge config={getMoneyModuleDestinations()} />
    </OsPage>
  );
}
