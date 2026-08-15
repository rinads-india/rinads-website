import Link from "next/link";
import { listBillingEventsAction } from "@/app/actions/billing";

export default async function BillingEventsPage() {
  const result = await listBillingEventsAction();
  if (!result.ok) {
    return <p className="text-red-400">{result.error}</p>;
  }

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-muted-foreground">← Dashboard</Link>
      <h2 className="text-xl font-semibold">Billing webhook events</h2>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Organization</th>
              <th>Processed</th>
            </tr>
          </thead>
          <tbody>
            {result.events.map((e) => (
              <tr key={e.id}>
                <td>{e.eventType}</td>
                <td>{e.organizationId ?? "—"}</td>
                <td>{e.processedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
