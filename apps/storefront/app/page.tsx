import Link from "next/link";
import { Button } from "@rinads/ui";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { ProductGrid } from "@/components/ProductGrid";
import { RinpoPanel } from "@/components/RinpoPanel";
import { getCartForDisplay } from "@/lib/cart";

export default async function HomePage() {
  const products = commerce.catalog.listPublished(getCommerceContext());
  const cart = await getCartForDisplay();

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-2xl border border-rinads-primary/20 bg-gradient-to-br from-rinads-primary/10 to-surface p-8">
          <h1 className="text-3xl font-bold text-foreground">Ambady Storefront</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Premium pebbles and river stones for landscaping, gardens, and aquariums. Phase 09 commerce
            demo powered by RINADS.
          </p>
          <div className="mt-4">
            <Link href="/shop">
              <Button>Browse shop</Button>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Featured products</h2>
          <ProductGrid products={products} />
        </section>
      </div>
      <RinpoPanel route="/" cartId={cart?.id} />
    </>
  );
}
