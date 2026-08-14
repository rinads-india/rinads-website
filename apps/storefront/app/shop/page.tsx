import Link from "next/link";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { ProductGrid } from "@/components/ProductGrid";
import { RinpoPanel } from "@/components/RinpoPanel";
import { getOrCreateCart } from "@/lib/cart";

type ShopPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;
  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();

  const allProducts = commerce.catalog.listPublished(ctx);
  const categories = [...new Set(allProducts.map((p) => p.categorySlug))].sort();

  const products = category
    ? commerce.catalog.search(ctx, "", { categorySlug: category })
    : allProducts;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          <p className="text-sm text-muted-foreground">Browse Ambady landscaping products.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/shop"
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              !category
                ? "bg-rinads-primary text-white"
                : "border border-rinads-primary/25 text-foreground hover:bg-surface-muted"
            }`}
          >
            All
          </Link>
          {categories.map((slug) => (
            <Link
              key={slug}
              href={`/shop?category=${slug}`}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                category === slug
                  ? "bg-rinads-primary text-white"
                  : "border border-rinads-primary/25 text-foreground hover:bg-surface-muted"
              }`}
            >
              {slug.replace(/-/g, " ")}
            </Link>
          ))}
        </div>

        <ProductGrid
          products={products}
          emptyTitle="No products in this category"
          emptyDescription="Try another category or view all products."
        />
      </div>
      <RinpoPanel route="/shop" cartId={cart.id} />
    </>
  );
}
