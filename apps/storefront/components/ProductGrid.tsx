import type { ProductCard as ProductCardType } from "@rinads/commerce";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: ProductCardType[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription = "Try a different search or category.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-rinads-primary/25 bg-surface-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
        <span className="mb-1 block text-lg font-semibold text-foreground">{emptyTitle}</span>
        {emptyDescription}
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
