import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@rinads/ui";
import { loadOwnerCatalogRuntime } from "@/lib/catalog-runtime";
import { ProductEditorForm } from "./ProductEditorForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const runtime = await loadOwnerCatalogRuntime();
  const product = runtime.store.products.find((candidate) => candidate.id === id);

  if (!product) notFound();

  const variants = runtime.store.variants.filter((variant) => variant.productId === product.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/products" className="text-sm text-rinads-primary hover:underline">
            ← Products
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Edit product</h2>
            <Badge tone={runtime.demo ? "warning" : "success"}>
              {runtime.demo ? "Demo data" : "Production tenant"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{product.id}</p>
        </div>
        <Badge tone={product.status === "published" ? "success" : product.status === "draft" ? "warning" : "default"}>
          {product.status}
        </Badge>
      </div>

      <ProductEditorForm product={product} variants={variants} stockEditable={runtime.demo} />
    </div>
  );
}
