import Link from "next/link";
import { notFound } from "next/navigation";
import { listTenantsAction, setTenantStatusAction } from "../../actions/tenants";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listTenantsAction();
  if (!result.ok) notFound();

  const tenant = result.tenants.find((t) => t.id === id);
  if (!tenant) notFound();

  async function suspend() {
    "use server";
    await setTenantStatusAction(id, "suspended");
  }

  async function reactivate() {
    "use server";
    await setTenantStatusAction(id, "active");
  }

  return (
    <div className="space-y-6">
      <Link href="/tenants" className="text-sm text-muted-foreground">
        ← Back to tenants
      </Link>
      <div className="card space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">{tenant.name}</h2>
          <p className="text-sm text-muted-foreground">{tenant.slug} · {tenant.status}</p>
        </div>
        <div className="flex gap-3">
          <form action={suspend}>
            <button type="submit" className="rounded border border-red-400/40 px-3 py-1.5 text-sm text-red-300">
              Suspend
            </button>
          </form>
          <form action={reactivate}>
            <button type="submit" className="rounded border border-green-400/40 px-3 py-1.5 text-sm text-green-300">
              Reactivate
            </button>
          </form>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href={`/tenants/${id}/flags`} className="text-rinads-primary">Feature flags</Link>
          <Link href={`/tenants/${id}/billing`} className="text-rinads-primary">Billing</Link>
          <Link href={`/tenants/${id}/domains`} className="text-rinads-primary">Domains</Link>
          <Link href={`/tenants/${id}/audit`} className="text-rinads-primary">Audit log</Link>
        </div>
      </div>
    </div>
  );
}
