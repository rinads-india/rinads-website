import Link from "next/link";
import { notFound } from "next/navigation";
import { listTenantsAction } from "@/app/actions/tenants";
import { getTenantBillingAction } from "@/app/actions/billing";

export default async function TenantBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenants = await listTenantsAction();
  if (!tenants.ok || !tenants.tenants.find((t) => t.id === id)) notFound();

  const billing = await getTenantBillingAction(id);
  if (!billing.ok) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/tenants/${id}`} className="text-sm text-muted-foreground">← Tenant detail</Link>
      <h2 className="text-xl font-semibold">Billing</h2>
      <div className="card space-y-3 text-sm">
        <p>Plan: {billing.subscription?.planKey ?? "—"} ({billing.subscription?.status ?? "unknown"})</p>
        <p>Orders this month: {billing.usage.ordersThisMonth} / {billing.limits.ordersPerMonth ?? "∞"}</p>
        <p>Seats: {billing.usage.seats} / {billing.limits.seats ?? "∞"}</p>
        <p className="text-muted-foreground">Upgrade via Razorpay checkout (owner portal /settings/billing).</p>
      </div>
    </div>
  );
}
