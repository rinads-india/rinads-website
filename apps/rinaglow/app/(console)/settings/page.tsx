import { Card, EmptyState } from "@rinads/ui";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { NewBranchForm } from "./NewBranchForm";

export const metadata = { title: "Settings — R GLOW Console" };

export default async function SettingsPage() {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const result = await repo.listBranches(tenancy.organizationId);
  const branches = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Branches, hours, and organization details.</p>
      </div>

      <Card>
        <p className="section-title">Add a branch</p>
        <NewBranchForm />
      </Card>

      {!result.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load branches: {result.error.message}</p>
        </Card>
      ) : branches.length === 0 ? (
        <EmptyState title="No branches yet" description="Add your first branch above to start scheduling staff." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Phone</th>
                <th>Timezone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium text-foreground">{b.name}</td>
                  <td>{b.city ?? "—"}</td>
                  <td>{b.phone ?? "—"}</td>
                  <td>{b.timezone}</td>
                  <td>{b.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
