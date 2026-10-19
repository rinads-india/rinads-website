import { Badge, Card, EmptyState } from "@rinads/ui";
import { quantityForBranch, quantityUniversal, stockStatus, stockStatusLabel } from "@rinads/salon";
import Link from "next/link";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { AdjustStockForm, NewProductForm } from "./InventoryForms";
import { TransferModal } from "./TransferModal";

export const metadata = { title: "Inventory — R GLOW Console" };

const STATUS_TONE: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-800",
  low: "bg-amber-100 text-amber-800",
  critical: "bg-orange-100 text-orange-800",
  out: "bg-red-100 text-red-700",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; scope?: string }>;
}) {
  const tenancy = await requireTenancy();
  const { branch: branchFilter, scope } = await searchParams;
  const universal = scope === "universal";
  const repo = await getSalonRepository();
  const [branchesResult, productsResult, levelsResult, transfersResult] = await Promise.all([
    repo.listBranches(tenancy.organizationId),
    repo.listProducts(tenancy.organizationId),
    repo.listStockLevels(tenancy.organizationId),
    repo.listStockTransfers(tenancy.organizationId),
  ]);

  const branches = branchesResult.ok ? branchesResult.data.filter((branch) => branch.isActive) : [];
  const products = productsResult.ok ? productsResult.data.filter((product) => product.isActive) : [];
  const levels = levelsResult.ok ? levelsResult.data : [];
  const transfers = transfersResult.ok ? transfersResult.data : [];
  const selectedBranch = branchFilter ? branches.find((branch) => branch.id === branchFilter) : branches[0];
  const storeLabel = universal ? "Universal" : selectedBranch?.name ?? "this store";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Inventory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Products and stock per store, with adjustments and transfers. Quantities come from live salon stock rows — never demo data.
          </p>
        </div>
        <TransferModal branches={branches} products={products} levels={levels} currentBranchId={selectedBranch?.id} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={branchFilter ? `/inventory?branch=${branchFilter}` : "/inventory"}
          className={!universal ? "btn-primary text-xs" : "btn-secondary text-xs"}
        >
          {selectedBranch?.name ?? "Store"} stock
        </Link>
        <Link
          href={branchFilter ? `/inventory?scope=universal&branch=${branchFilter}` : "/inventory?scope=universal"}
          className={universal ? "btn-primary text-xs" : "btn-secondary text-xs"}
        >
          Universal
        </Link>
      </div>

      <Card>
        <p className="section-title">Add a product</p>
        <NewProductForm />
      </Card>

      {!productsResult.ok ? (
        <Card>
          <p className="text-sm text-danger">Could not load products: {productsResult.error.message}</p>
        </Card>
      ) : products.length === 0 ? (
        <EmptyState title="No products yet" description="Add a product above, then record opening stock for a store." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Qty ({storeLabel})</th>
                <th>Reorder at</th>
                <th>Status</th>
                <th>Adjust</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const qty = universal
                  ? quantityUniversal(levels, product.id)
                  : quantityForBranch(levels, product.id, selectedBranch?.id ?? "");
                const status = stockStatus(qty, product.reorderAt);
                return (
                  <tr key={product.id}>
                    <td className="font-medium text-foreground">{product.name}</td>
                    <td>{product.category}</td>
                    <td>{qty}</td>
                    <td>{product.reorderAt}</td>
                    <td>
                      <Badge className={STATUS_TONE[status]}>{stockStatusLabel(status)}</Badge>
                    </td>
                    <td>
                      {universal || !selectedBranch ? "—" : <AdjustStockForm branch={selectedBranch} product={product} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Card>
        <p className="section-title">Recent transfers</p>
        {transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transfers yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {transfers.slice(0, 8).map((transfer) => {
              const from = branches.find((branch) => branch.id === transfer.fromBranchId)?.name ?? "Store";
              const to = branches.find((branch) => branch.id === transfer.toBranchId)?.name ?? "Store";
              const units = transfer.lines.reduce((sum, line) => sum + line.quantity, 0);
              return (
                <li key={transfer.id} className="flex justify-between gap-3 rounded-lg border border-rinads-primary/10 px-3 py-2">
                  <span>
                    {from} → {to}
                  </span>
                  <span className="text-muted-foreground">{units} units</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
