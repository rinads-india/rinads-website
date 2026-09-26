import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function PackPage() {
  const ctx = opsContext();
  const toPack = operations.fulfilment.list(ctx).filter((f) =>
    ["picked", "packing"].includes(f.status)
  );

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-xl font-semibold">Pack (mobile)</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr><th>Order</th><th>Status</th></tr>
          </thead>
          <tbody>
            {toPack.length === 0 ? (
              <tr><td colSpan={2} className="p-4 text-muted-foreground">Nothing ready to pack.</td></tr>
            ) : (
              toPack.map((f) => (
                <tr key={f.id}><td>{f.orderId}</td><td>{f.status}</td></tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
