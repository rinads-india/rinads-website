import Image from "next/image";
import { Badge, Card, EmptyState } from "@rinads/ui";
import { formatInr, listWishlistItems, portalContext } from "@/lib/commerce";

export default function WishlistPage() {
  const ctx = portalContext();
  const items = listWishlistItems(ctx);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Products you have saved for later.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save items from the storefront to see them here."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ variantId, variant, product }) => (
            <li key={variantId}>
              <Card className="space-y-3">
                {product.primaryImageUrl ? (
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-muted">
                    <Image
                      src={product.primaryImageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                ) : null}
                <div>
                  <p className="font-semibold text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{variant.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatInr(variant.price)}</span>
                  <Badge tone={variant.stock > 0 ? "success" : "warning"}>
                    {variant.stock > 0 ? "In stock" : "Out of stock"}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
