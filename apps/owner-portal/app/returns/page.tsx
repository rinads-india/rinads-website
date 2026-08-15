import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function ReturnsPage() {
  const ctx = opsContext();
  const returns = operations.returns.list(ctx);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Returns</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No return requests.</td></tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id}>
                  <td>{r.orderId}</td>
                  <td>{r.status}</td>
                  <td>{r.reason}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
