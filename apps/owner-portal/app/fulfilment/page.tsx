import Link from "next/link";
import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function FulfilmentPage() {
  const ctx = opsContext();
  const records = operations.fulfilment.list(ctx);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/fulfilment/pick" className="text-rinads-primary hover:underline">Mobile pick</Link>
        <Link href="/fulfilment/pack" className="text-rinads-primary hover:underline">Mobile pack</Link>
        <Link href="/shipping" className="text-rinads-primary hover:underline">Shipments</Link>
      </div>
      <h2 className="text-2xl font-semibold">Fulfilment queue</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Location</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No fulfilment records. Orders create fulfilment on payment.</td></tr>
            ) : (
              records.map((f) => (
                <tr key={f.id}>
                  <td>{f.orderId}</td>
                  <td>{f.status}</td>
                  <td>{f.locationId}</td>
                  <td>{new Date(f.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
