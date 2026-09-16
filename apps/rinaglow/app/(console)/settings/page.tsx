import { Card, EmptyState } from "@rinads/ui";
import { getBookingReadiness } from "@rinads/salon";
import { WorkingHoursEditor } from "@/components/WorkingHoursEditor";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { NewBranchForm } from "./NewBranchForm";
import { CopyBookingLink } from "./BookingReadiness";

export const metadata = { title: "Settings — R GLOW Console" };

export default async function SettingsPage() {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const [result, servicesResult, staffResult] = await Promise.all([
    repo.listBranches(tenancy.organizationId),
    repo.listServices(tenancy.organizationId),
    repo.listStaff(tenancy.organizationId),
  ]);
  const branches = result.ok ? result.data : [];
  const readiness = getBookingReadiness(
    branches,
    servicesResult.ok ? servicesResult.data : [],
    staffResult.ok ? staffResult.data : []
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const bookingUrl = siteUrl
    ? `${siteUrl}/solutions/salon/book?org=${encodeURIComponent(tenancy.organizationSlug)}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Branches, hours, and organization details.</p>
      </div>

      <Card>
        <p className="section-title">Public booking</p>
        {bookingUrl ? (
          <CopyBookingLink url={bookingUrl} />
        ) : (
          <p className="mt-2 text-sm text-danger">NEXT_PUBLIC_SITE_URL is not configured, so a booking link cannot be published.</p>
        )}
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          <li>{readiness.activeBranch ? "✓" : "○"} Active branch</li>
          <li>{readiness.activeService ? "✓" : "○"} Active service</li>
          <li>{readiness.activeStaff ? "✓" : "○"} Active staff at an active branch</li>
        </ul>
        <p className={`mt-3 text-sm ${readiness.ready && bookingUrl ? "text-emerald-700" : "text-muted-foreground"}`}>
          {readiness.ready && bookingUrl ? "Public booking is ready." : "Complete every item and configure the site URL before sharing."}
        </p>
      </Card>

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
                <th>Hours</th>
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
                  <td>
                    <details>
                      <summary className="cursor-pointer text-rinads-primary">Edit hours</summary>
                      <div className="mt-2">
                        <WorkingHoursEditor kind="branch" entityId={b.id} initialHours={b.workingHours} />
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
