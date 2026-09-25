import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function ReceiptsPage() {
  const ctx = opsContext();
  const receipts = operations.goodsReceipts.list(ctx);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Goods receipts</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>PO</th>
              <th>Location</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No receipts yet.</td></tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id}>
                  <td>{r.receiptNumber}</td>
                  <td>{r.purchaseOrderId}</td>
                  <td>{r.locationId}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
