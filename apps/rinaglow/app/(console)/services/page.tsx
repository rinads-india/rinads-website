import { Card, EmptyState } from "@rinads/ui";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { NewServiceForm } from "./NewServiceForm";

export const metadata = { title: "Services — R GLOW Console" };

export default async function ServicesPage() {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.listServices(tenancy.organizationId);
  const services = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Services</h2>
        <p className="mt-1 text-sm text-muted-foreground">The menu customers can book from — duration and price.</p>
      </div>

      <Card>
        <p className="section-title">Add a service</p>
        <NewServiceForm />
      </Card>

      {!result.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load services: {result.error.message}</p>
        </Card>
      ) : services.length === 0 ? (
        <EmptyState title="No services yet" description="Add your first service above to start taking bookings." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-foreground">{s.name}</td>
                  <td>{s.category}</td>
                  <td>{s.durationMin} min</td>
                  <td>
                    {s.currency} {s.price.toLocaleString("en-IN")}
                  </td>
                  <td>{s.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
