import Link from "next/link";
import { Badge, Card, EmptyState } from "@rinads/ui";
import { demoContext, listAllProducts, commerce } from "@/lib/commerce";

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

export default function ProductsPage() {
  const ctx = demoContext();
  const products = listAllProducts(ctx);
  const store = commerce.repo.getStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Products</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All catalog items including drafts and archived products.
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
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variants = store.variants.filter((v) => v.productId === product.id);
                const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
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
        Staff with <code className="text-xs">commerce.catalog.write</code> (Phase 1+) can edit products.
        Current session uses founder role for demo navigation only.
      </p>
    </div>
  );
}
