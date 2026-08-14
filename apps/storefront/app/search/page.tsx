import { commerce, getCommerceContext } from "@/lib/commerce";
import { ProductGrid } from "@/components/ProductGrid";
import { RinpoPanel } from "@/components/RinpoPanel";
import { getOrCreateCart } from "@/lib/cart";
import { Input } from "@rinads/ui";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const ctx = getCommerceContext();
  const cart = await getOrCreateCart();

  const products = q.trim() ? commerce.catalog.search(ctx, q) : [];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search</h1>
          <p className="text-sm text-muted-foreground">Find products by name, tag, or SKU.</p>
        </div>

        <form action="/search" method="get" className="flex max-w-md gap-2">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search pebbles, stones, SKU…"
            aria-label="Search query"
          />
          <button
            type="submit"
            className="rounded-lg bg-rinads-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Search
          </button>
        </form>

        {q.trim() ? (
          <ProductGrid
            products={products}
            emptyTitle="No results"
            emptyDescription={`Nothing matched "${q}". Try another term.`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Enter a search term to get started.</p>
        )}
      </div>
      <RinpoPanel route="/search" cartId={cart.id} />
    </>
  );
}
