import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function ShippingPage() {
  const ctx = opsContext();
  const shipments = operations.shipments.list(ctx);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Shipments</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>AWB</th>
              <th>Carrier</th>
              <th>Status</th>
              <th>Tracking</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No shipments yet.</td></tr>
            ) : (
              shipments.map((s) => (
                <tr key={s.id}>
                  <td>{s.awb ?? "—"}</td>
                  <td>{s.carrier}</td>
                  <td>{s.status}</td>
                  <td>{s.trackingUrl ? <a href={s.trackingUrl} className="text-rinads-primary hover:underline">Track</a> : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
