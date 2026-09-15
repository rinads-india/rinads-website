import { Card, EmptyState } from "@rinads/ui";
import { WorkingHoursEditor } from "@/components/WorkingHoursEditor";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { NewStaffForm } from "./NewStaffForm";

export const metadata = { title: "Staff — R GLOW Console" };

export default async function StaffPage() {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const [staffResult, branchesResult] = await Promise.all([
    repo.listStaff(tenancy.organizationId),
    repo.listBranches(tenancy.organizationId),
  ]);
  const staff = staffResult.ok ? staffResult.data : [];
  const branches = branchesResult.ok ? branchesResult.data : [];
  const branchesById = new Map(branches.map((b) => [b.id, b]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Staff</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff assigned to a branch see only that branch&rsquo;s calendar once they sign in with a linked account.
        </p>
      </div>

      <Card>
        <p className="section-title">Add staff</p>
        <NewStaffForm branches={branches} />
        <p className="rbac-note mt-3">
          To grant sign-in access, invite them as an organization member from the platform admin console, then link
          their account here. Front-of-house profiles can be added first and linked later.
        </p>
      </Card>

      {!staffResult.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load staff: {staffResult.error.message}</p>
        </Card>
      ) : staff.length === 0 ? (
        <EmptyState title="No staff yet" description="Add your first team member above." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Specialties</th>
                <th>Status</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-foreground">{s.displayName}</td>
                  <td>{s.branchId ? branchesById.get(s.branchId)?.name ?? "—" : "Unassigned"}</td>
                  <td>{s.specialties.join(", ") || "—"}</td>
                  <td>{s.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <details>
                      <summary className="cursor-pointer text-rinads-primary">Edit hours</summary>
                      <div className="mt-2">
                        <WorkingHoursEditor kind="staff" entityId={s.id} initialHours={s.workingHours} />
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
