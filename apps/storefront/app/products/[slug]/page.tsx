import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge, Card } from "@rinads/ui";
import { commerce, getCommerceContext } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import { getCartForDisplay } from "@/lib/cart";
import { AddToCartForm } from "@/components/AddToCartForm";
import { VariantSelector } from "@/components/VariantSelector";
import { RinpoPanel } from "@/components/RinpoPanel";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { variant: variantParam } = await searchParams;
  const ctx = getCommerceContext();
  const cart = await getCartForDisplay();

  const result = commerce.catalog.getBySlug(ctx, slug);
  if (!result.ok) notFound();

  const product = result.data;
  const selectedVariant =
    product.variants.find((v) => v.id === variantParam) ??
    product.variants.find((v) => v.stock > 0) ??
    product.variants[0];

  const primaryImage = product.media.find((m) => m.isPrimary) ?? product.media[0];

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-rinads-primary/15 bg-surface-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>

        <div className="space-y-5">
          <div>
            <Badge className="mb-2 capitalize">{product.categorySlug.replace(/-/g, " ")}</Badge>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="mt-2 text-muted-foreground">{product.description}</p>
          </div>

          {selectedVariant ? (
            <Card className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Selected variant</p>
                <p className="text-2xl font-bold text-rinads-primary">
                  {formatINR(selectedVariant.price)}
                </p>
                {selectedVariant.compareAtPrice ? (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatINR(selectedVariant.compareAtPrice)}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  SKU {selectedVariant.sku} · {selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : "Out of stock"}
                </p>
              </div>

              <VariantSelector
                variants={product.variants}
                selectedVariantId={selectedVariant.id}
                slug={slug}
              />

              <AddToCartForm variantId={selectedVariant.id} inStock={selectedVariant.stock > 0} />
            </Card>
          ) : null}
        </div>
      </div>

      <RinpoPanel
        route={`/products/${slug}`}
        productId={product.id}
        cartId={cart?.id}
        slug={slug}
      />
    </>
  );
}
