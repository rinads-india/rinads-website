import { Card, EmptyState } from "@rinads/ui";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export const metadata = { title: "Clients — R GLOW Console" };

export default async function ClientsPage() {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.listCustomers(tenancy.organizationId);
  const customers = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Clients</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clients are created automatically the first time they book — phone-first, no account required.
        </p>
      </div>

      {!result.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load clients: {result.error.message}</p>
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Clients will appear here as soon as your first booking comes in."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Marketing consent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-foreground">{c.name ?? "—"}</td>
                  <td>{c.phone}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.marketingConsent ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
