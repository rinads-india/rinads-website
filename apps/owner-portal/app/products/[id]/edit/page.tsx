import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@rinads/ui";
import { demoContext, getProductWithDetails } from "@/lib/commerce";
import { ProductEditorForm } from "./ProductEditorForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = demoContext();
  const details = getProductWithDetails(ctx, id);

  if (!details) notFound();

  const { product, variants } = details;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/products" className="text-sm text-rinads-primary hover:underline">
            ← Products
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Edit product</h2>
          <p className="text-sm text-muted-foreground">{product.id}</p>
        </div>
        <Badge tone={product.status === "published" ? "success" : product.status === "draft" ? "warning" : "default"}>
          {product.status}
        </Badge>
      </div>

      <ProductEditorForm product={product} variants={variants} />
    </div>
  );
}
