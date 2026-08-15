import Link from "next/link";
import { Badge, Card } from "@rinads/ui";
import { OwnerRinpoBrief } from "@/components/OwnerRinpoBrief";
import { commerce, demoContext, listOrgOrders, operations, opsContext } from "@/lib/commerce";

export default function OperationsPage() {
  const ctx = opsContext();
  const commerceCtx = demoContext();
  const queue = operations.workQueue.buildQueue(ctx);
  const alerts = operations.alertEngine.list(ctx);
  const kpis = operations.kpi.snapshot(
    ctx,
    listOrgOrders(commerceCtx).map((o) => ({
      grandTotal: o.grandTotal,
      discountTotal: o.discountTotal,
      lines: o.lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice })),
    }))
  );
  const lowStock = operations.lowStock.listLowStock(ctx);
  const pendingPO = operations.purchaseOrders.pendingApprovals(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Today</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Actionable operational summary from the canonical ERP engine.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs text-muted-foreground">Net sales</p><p className="text-2xl font-bold">₹{kpis.netSales.toLocaleString("en-IN")}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Pending fulfilment</p><p className="text-2xl font-bold">{kpis.pendingFulfilment}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Low stock SKUs</p><p className="text-2xl font-bold">{kpis.lowStockCount}</p></Card>
        <Card><p className="text-xs text-muted-foreground">Open alerts</p><p className="text-2xl font-bold">{alerts.length}</p></Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold">Work queue</h3>
          </div>
          {queue.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No pending operational items.</p>
          ) : (
            <ul className="divide-y divide-border">
              {queue.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.subtitle ? <p className="text-muted-foreground">{item.subtitle}</p> : null}
                  </div>
                  <Badge tone="warning">P{item.priority}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold">Low stock</h3>
            <Link href="/inventory" className="text-xs text-rinads-primary hover:underline">Inventory</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">All tracked SKUs above reorder point.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.slice(0, 6).map((item) => (
                <li key={item.variantId} className="px-4 py-3 text-sm">
                  <p className="font-medium">{item.variantId}</p>
                  <p className="text-muted-foreground">{item.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {pendingPO.length > 0 ? (
        <Card>
          <h3 className="font-semibold">Purchase approvals pending</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {pendingPO.map((po) => (
              <li key={po.id}>
                <Link href={`/procurement/purchase-orders/${po.id}`} className="text-rinads-primary hover:underline">
                  {po.poNumber} — ₹{po.grandTotal.toLocaleString("en-IN")}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <OwnerRinpoBrief />
    </div>
  );
}
