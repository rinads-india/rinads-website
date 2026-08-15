import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function TransfersPage() {
  const ctx = opsContext();
  const transfers = operations.transfers.list(ctx);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Stock transfers</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Transfer #</th>
              <th>Status</th>
              <th>From → To</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No transfers yet.</td></tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id}>
                  <td>{t.transferNumber}</td>
                  <td>{t.status}</td>
                  <td>{t.fromLocationId} → {t.toLocationId}</td>
                  <td>{new Date(t.updatedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
