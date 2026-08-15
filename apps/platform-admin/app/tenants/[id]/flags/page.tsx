import Link from "next/link";
import { notFound } from "next/navigation";
import { listTenantsAction } from "@/app/actions/tenants";
import { planFeatureFlags } from "@rinads/tenancy";

export default async function TenantFlagsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listTenantsAction();
  if (!result.ok) notFound();
  if (!result.tenants.find((t) => t.id === id)) notFound();

  const flags = planFeatureFlags({ planKey: "growth" });

  return (
    <div className="space-y-4">
      <Link href={`/tenants/${id}`} className="text-sm text-muted-foreground">← Tenant detail</Link>
      <h2 className="text-xl font-semibold">Feature flags</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Flag</th>
              <th>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(flags).map(([key, enabled]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{enabled ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
