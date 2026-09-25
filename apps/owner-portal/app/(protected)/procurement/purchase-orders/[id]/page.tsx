import { notFound } from "next/navigation";
import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = opsContext();
  const result = operations.purchaseOrders.getById(ctx, id);
  if (!result.ok) notFound();
  const po = result.data;
  const lines = operations.purchaseOrders.getLines(id);
  const supplier = operations.suppliers.list(ctx).find((s) => s.id === po.supplierId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{po.poNumber}</h2>
      <Card>
        <p className="text-sm text-muted-foreground">Supplier: {supplier?.name ?? po.supplierId}</p>
        <p className="text-sm">Status: {po.status}</p>
        <p className="text-lg font-semibold mt-2">₹{po.grandTotal.toLocaleString("en-IN")}</p>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Variant</th>
              <th>Qty</th>
              <th>Received</th>
              <th>Unit cost</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="font-mono text-xs">{l.variantId}</td>
                <td>{l.quantity}</td>
                <td>{l.quantityReceived}</td>
                <td>₹{l.unitCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
