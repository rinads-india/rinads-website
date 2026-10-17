import Link from "next/link";
import { Badge, Card, EmptyState } from "@rinads/ui";
import { loadOwnerCatalogRuntime } from "@/lib/catalog-runtime";

function statusTone(status: string): "default" | "success" | "warning" | "danger" {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "warning";
    case "archived":
      return "danger";
    default:
      return "default";
  }
}

export default async function ProductsPage() {
  const runtime = await loadOwnerCatalogRuntime();
  const products = runtime.store.products;
  const store = runtime.store;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">Products</h2>
          <Badge tone={runtime.demo ? "warning" : "success"}>
            {runtime.demo ? "Demo data" : "Production tenant"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Catalog items for the active organization, including drafts and archived products.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products" description="The catalog is empty for this organization." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Stock projection</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variants = store.variants.filter((variant) => variant.productId === product.id);
                const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
                return (
                  <tr key={product.id}>
                    <td>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.slug}</p>
                    </td>
                    <td>
                      <Badge tone={statusTone(product.status)}>{product.status}</Badge>
                    </td>
                    <td className="text-muted-foreground">{product.categorySlug}</td>
                    <td>{variants.length}</td>
                    <td>{totalStock}</td>
                    <td>
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="text-sm font-medium text-rinads-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <p className="rbac-note">
        Catalog reads are tenant-bound in production. Product editing remains subject to the existing
        <code className="mx-1 text-xs">commerce.catalog.write</code>
        permission and its route-level production hardening.
      </p>
    </div>
  );
}
