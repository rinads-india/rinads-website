import Link from "next/link";
import { Card } from "@rinads/ui";
import { commerce, demoContext, operations, opsContext } from "@/lib/commerce";

export default function InventoryPage() {
  const ctx = opsContext();
  const commerceCtx = demoContext();
  const store = commerce.repo.getStore();
  const locations = operations.locations.list(ctx);
  const variants = store.variants.filter((v) => v.organizationId === ctx.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Inventory</h2>
          <p className="text-sm text-muted-foreground">Stock from immutable ledger — not direct variant edits.</p>
        </div>
        <Link href="/inventory/transfers" className="text-sm text-rinads-primary hover:underline">
          Transfers
        </Link>
      </div>

      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Variant</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Incoming</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const balance = operations.ledger.getBalance(ctx, v.id);
              const status = operations.ledger.getStockStatus(ctx, v.id);
              return (
                <tr key={v.id}>
                  <td className="font-mono text-xs">{v.sku}</td>
                  <td>{v.name}</td>
                  <td>{balance.onHand}</td>
                  <td>{balance.reserved}</td>
                  <td>{balance.available}</td>
                  <td>{balance.incoming}</td>
                  <td>{status.replace("_", " ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <section>
        <h3 className="section-title">Locations</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <p className="font-medium">{loc.name}</p>
              <p className="text-xs text-muted-foreground">{loc.code}{loc.isDefault ? " · default" : ""}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">Recent movements</h3>
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Variant</th>
                <th>Delta</th>
                <th>Reference</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {operations.ledger.listMovements(ctx).slice(0, 15).map((m) => (
                <tr key={m.id}>
                  <td>{m.movementType}</td>
                  <td className="font-mono text-xs">{m.variantId}</td>
                  <td>{m.quantityDelta}</td>
                  <td>{m.referenceType ?? "—"} {m.referenceId ?? ""}</td>
                  <td className="text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
