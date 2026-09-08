import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Card, EmptyState } from "@rinads/ui";
import { getSalonRepository } from "@/lib/salon";
import { oneDayAgoIso } from "@/lib/time";
import { requireTenancy } from "@/lib/tenancy";
import { RefundsQueue } from "./RefundsQueue";
import { SaleCard } from "./SaleCard";
import { StartSaleButton } from "./StartSaleButton";

export const metadata = { title: "POS — R GLOW Console" };

export default async function PosPage() {
  const tenancy = await requireTenancy();
  const repo = await getSalonRepository();
  const canOverridePricing = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.pricing.override");
  const canApproveRefunds = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("refund.approve");

  const [draftSalesResult, awaitingSalesResult, paidSalesResult, appointmentsResult, customersResult, refundsResult] =
    await Promise.all([
      repo.listSales(tenancy.organizationId, { status: "draft" }),
      repo.listSales(tenancy.organizationId, { status: "awaiting_payment" }),
      repo.listSales(tenancy.organizationId, { status: "paid" }),
      repo.listAppointments(tenancy.organizationId, { from: oneDayAgoIso() }),
      repo.listCustomers(tenancy.organizationId),
      repo.listRefunds(tenancy.organizationId, { status: "pending" }),
    ]);

  const customersById = new Map((customersResult.ok ? customersResult.data : []).map((c) => [c.id, c]));
  const openSaleAppointmentIds = new Set(
    [...(draftSalesResult.ok ? draftSalesResult.data : []), ...(awaitingSalesResult.ok ? awaitingSalesResult.data : []), ...(paidSalesResult.ok ? paidSalesResult.data : [])]
      .map((s) => s.appointmentId)
      .filter(Boolean)
  );
  const readyForCheckout = (appointmentsResult.ok ? appointmentsResult.data : []).filter(
    (a) => a.status === "completed" && !openSaleAppointmentIds.has(a.id)
  );

  const openSaleIds = [
    ...(draftSalesResult.ok ? draftSalesResult.data : []),
    ...(awaitingSalesResult.ok ? awaitingSalesResult.data : []),
  ].map((s) => s.id);
  const salesWithLines = await Promise.all(openSaleIds.map((id) => repo.getSale(id)));

  const recentPaid = (paidSalesResult.ok ? paidSalesResult.data : []).slice(0, 10);
  const recentPaidWithLines = await Promise.all(recentPaid.map((s) => repo.getSale(s.id)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">POS</h2>
        <p className="mt-1 text-sm text-muted-foreground">Checkout, payments, and refunds — totals are always computed server-side.</p>
      </div>

      <Card>
        <p className="section-title">Ready for checkout</p>
        {readyForCheckout.length === 0 ? (
          <EmptyState title="Nothing waiting" description="Completed appointments without a sale yet will appear here." />
        ) : (
          <ul className="mt-3 space-y-2">
            {readyForCheckout.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-rinads-primary/10 p-2.5 text-sm">
                <span>{customersById.get(a.customerId)?.name ?? customersById.get(a.customerId)?.phone ?? "Walk-in customer"}</span>
                <StartSaleButton appointmentId={a.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="section-title">Open sales</p>
        {salesWithLines.length === 0 ? (
          <EmptyState title="No open sales" description="Start a checkout above to see it here." />
        ) : (
          <div className="mt-3 space-y-3">
            {salesWithLines.map((result) =>
              result.ok ? (
                <SaleCard
                  key={result.data.id}
                  sale={result.data}
                  customerLabel={
                    (result.data.customerId && (customersById.get(result.data.customerId)?.name ?? customersById.get(result.data.customerId)?.phone)) ??
                    "Walk-in customer"
                  }
                  canOverridePricing={canOverridePricing}
                />
              ) : null
            )}
          </div>
        )}
      </Card>

      <Card>
        <p className="section-title">Refund requests</p>
        <div className="mt-3">
          <RefundsQueue refunds={refundsResult.ok ? refundsResult.data : []} canApprove={canApproveRefunds} />
        </div>
      </Card>

      <Card>
        <p className="section-title">Recently paid</p>
        {recentPaidWithLines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid sales yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {recentPaidWithLines.map((result) =>
              result.ok ? (
                <SaleCard
                  key={result.data.id}
                  sale={result.data}
                  customerLabel={
                    (result.data.customerId && (customersById.get(result.data.customerId)?.name ?? customersById.get(result.data.customerId)?.phone)) ??
                    "Walk-in customer"
                  }
                  canOverridePricing={canOverridePricing}
                />
              ) : null
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
