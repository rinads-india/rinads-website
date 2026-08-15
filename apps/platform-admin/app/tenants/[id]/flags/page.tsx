import Link from "next/link";
import { notFound } from "next/navigation";
import { listTenantsAction } from "@/app/actions/tenants";
import { listTenantFlagsAction, setTenantFlagOverrideAction } from "@/app/actions/flags";

export default async function TenantFlagsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listTenantsAction();
  if (!result.ok) notFound();
  if (!result.tenants.find((t) => t.id === id)) notFound();

  const flags = await listTenantFlagsAction(id);
  if (!flags.ok) notFound();

  async function toggleFlag(formData: FormData) {
    "use server";
    const flagKey = String(formData.get("flagKey") ?? "");
    const enabled = formData.get("enabled") === "true";
    await setTenantFlagOverrideAction(id, flagKey, enabled);
  }

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
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flags.flags.map(({ key, enabled, source }) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{enabled ? "Yes" : "No"}</td>
                <td>{source}</td>
                <td>
                  <form action={toggleFlag}>
                    <input type="hidden" name="flagKey" value={key} />
                    <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                    <button type="submit" className="text-sm text-rinads-primary">
                      {enabled ? "Disable" : "Enable"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
