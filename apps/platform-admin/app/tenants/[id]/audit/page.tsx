import Link from "next/link";
import { notFound } from "next/navigation";
import { listTenantsAction } from "@/app/actions/tenants";

export default async function TenantAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listTenantsAction();
  if (!result.ok) notFound();
  if (!result.tenants.find((t) => t.id === id)) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/tenants/${id}`} className="text-sm text-muted-foreground">← Tenant detail</Link>
      <h2 className="text-xl font-semibold">Audit log</h2>
      <p className="text-sm text-muted-foreground">
        Audit entries are written on provision, suspend, and member changes. Full viewer requires Supabase mode.
      </p>
    </div>
  );
}
