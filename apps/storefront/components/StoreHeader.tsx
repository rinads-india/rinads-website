import Link from "next/link";
import { Badge } from "@rinads/ui";
import { brand } from "@rinads/brand";
import { getCartForDisplay, getCartLineCount } from "@/lib/cart";

export async function StoreHeader() {
  const cart = await getCartForDisplay();
  const cartCount = getCartLineCount(cart);

  return (
    <header className="sticky top-0 z-50 border-b border-rinads-primary/15 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <span className="text-rinads-primary">A</span>
          <span>Ambady Store</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/shop" className="text-foreground hover:text-rinads-primary">
            Shop
          </Link>
          <Link href="/search" className="text-foreground hover:text-rinads-primary">
            Search
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-1.5 text-foreground hover:text-rinads-primary"
          >
            Cart
            {cartCount > 0 ? (
              <Badge tone="success" className="min-w-[1.25rem] justify-center">
                {cartCount}
              </Badge>
            ) : null}
          </Link>
        </nav>
      </div>
      <p className="sr-only">{brand.tagline}</p>
    </header>
  );
}
