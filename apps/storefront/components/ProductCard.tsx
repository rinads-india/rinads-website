import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardType } from "@rinads/commerce";
import { Badge, Card } from "@rinads/ui";
import { formatINR } from "@/lib/format";

type ProductCardProps = {
  product: ProductCardType;
};

export function ProductCard({ product }: ProductCardProps) {
  const priceLabel =
    product.minPrice === product.maxPrice
      ? formatINR(product.minPrice)
      : `${formatINR(product.minPrice)} – ${formatINR(product.maxPrice)}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:border-rinads-primary/40 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="group flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-rinads-primary">{product.name}</h3>
            {!product.inStock ? <Badge tone="warning">Out of stock</Badge> : null}
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          <p className="mt-auto text-sm font-semibold text-rinads-primary">{priceLabel}</p>
        </div>
      </Link>
    </Card>
  );
}
