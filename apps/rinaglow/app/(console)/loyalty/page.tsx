import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getLoyaltyLiabilitySummary } from "@rinads/salon-server";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { AdjustmentForm, ProgramForm } from "./LoyaltyForms";

export const metadata = { title: "Loyalty — R GLOW Console" };

export default async function LoyaltyPage() {
  const tenancy = await requireTenancy();
  const { repo, loyalty } = await getSalonDeps();
  const [program, accounts, customers, liability] = await Promise.all([
    loyalty.getProgram(tenancy.organizationId), loyalty.listAccounts(tenancy.organizationId),
    repo.listCustomers(tenancy.organizationId), getLoyaltyLiabilitySummary(loyalty, tenancy.organizationId),
  ]);
  const customerMap = new Map((customers.ok ? customers.data : []).map((customer) => [customer.id, customer]));
  const canManage = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.loyalty.manage");
  const canAdjust = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.loyalty.adjust");

  return <div className="space-y-6">
    <div><h2 className="text-2xl font-semibold">Loyalty</h2><p className="mt-1 text-sm text-muted-foreground">Earn, redemption, and append-only adjustment operations.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><p className="text-xs uppercase text-muted-foreground">Enrolled</p><p className="text-2xl font-semibold">{liability.enrolledCustomers}</p></Card>
      <Card><p className="text-xs uppercase text-muted-foreground">Outstanding points</p><p className="text-2xl font-semibold">{liability.outstandingPoints}</p></Card>
      <Card><p className="text-xs uppercase text-muted-foreground">Liability</p><p className="text-2xl font-semibold">{liability.currency} {liability.currencyLiability.toLocaleString("en-IN")}</p></Card>
    </div>
    {canManage ? <Card><p className="section-title">Program settings</p><ProgramForm program={program.ok ? program.data : undefined} /></Card> : null}
    {canAdjust ? <Card><p className="section-title">Manual adjustment</p><AdjustmentForm customers={customers.ok ? customers.data : []} /></Card> : null}
    <Card><p className="section-title">Customer balances</p>
      {!accounts.ok || accounts.data.length === 0 ? <EmptyState title="No loyalty accounts" description="Accounts are created automatically when a paid sale earns points." /> :
        <ul className="mt-3 divide-y">{accounts.data.map(({ account, balance, tier }) => {
          const customer = customerMap.get(account.customerId);
          return <li key={account.id} className="flex items-center justify-between py-2 text-sm">
            <Link href={`/clients/${account.customerId}`} className="font-medium hover:underline">{customer?.name ?? customer?.phone ?? account.customerId}</Link>
            <span>{balance} points · {tier.name}</span>
          </li>;
        })}</ul>}
    </Card>
  </div>;
}
