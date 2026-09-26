import Link from "next/link";
import { notFound } from "next/navigation";
import { listTenantsAction } from "@/app/actions/tenants";
import { listDomainsAction, addDomainAction, verifyDomainAction } from "@/app/actions/domains";

export default async function TenantDomainsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenants = await listTenantsAction();
  if (!tenants.ok || !tenants.tenants.find((t) => t.id === id)) notFound();

  const domains = await listDomainsAction(id);
  if (!domains.ok) notFound();

  async function addDomain(formData: FormData) {
    "use server";
    await addDomainAction(id, String(formData.get("hostname") ?? ""));
  }

  async function verifyDomain(formData: FormData) {
    "use server";
    await verifyDomainAction(String(formData.get("domainId") ?? ""), String(formData.get("hostname") ?? ""));
  }

  return (
    <div className="space-y-4">
      <Link href={`/tenants/${id}`} className="text-sm text-muted-foreground">← Tenant detail</Link>
      <h2 className="text-xl font-semibold">Custom domains</h2>
      <form action={addDomain} className="card flex gap-2">
        <input name="hostname" placeholder="shop.example.com" className="flex-1 rounded border border-white/10 bg-surface-muted px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-rinads-primary px-3 py-2 text-sm text-white">Add</button>
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Hostname</th>
              <th>Status</th>
              <th>Verification</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {domains.domains.map((d) => (
              <tr key={d.id}>
                <td>{d.hostname}</td>
                <td>{d.status}</td>
                <td className="text-xs text-muted-foreground">TXT _rinads-verify = {d.verificationToken}</td>
                <td>
                  <form action={verifyDomain}>
                    <input type="hidden" name="domainId" value={d.id} />
                    <input type="hidden" name="hostname" value={d.hostname} />
                    <button type="submit" className="text-sm text-rinads-primary">Verify</button>
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
