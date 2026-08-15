import Link from "next/link";
import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function PurchaseOrdersPage() {
  const ctx = opsContext();
  const orders = operations.purchaseOrders.list(ctx);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/procurement/suppliers" className="text-rinads-primary hover:underline">Suppliers</Link>
        <Link href="/procurement/receipts" className="text-rinads-primary hover:underline">Goods receipts</Link>
      </div>
      <h2 className="text-2xl font-semibold">Purchase orders</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>PO #</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No purchase orders yet.</td></tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id}>
                  <td>
                    <Link href={`/procurement/purchase-orders/${po.id}`} className="text-rinads-primary hover:underline">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td>{po.status}</td>
                  <td>₹{po.grandTotal.toLocaleString("en-IN")}</td>
                  <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
