"use server";

import { revalidatePath } from "next/cache";
import type { Product, ProductMedia, ProductStatus, ProductVariant } from "@rinads/commerce";
import { commerce, demoContext, getProductWithDetails } from "@/lib/commerce";

export type SaveProductState = {
  ok: boolean;
  message?: string;
};

export async function saveProduct(
  _prev: SaveProductState,
  formData: FormData
): Promise<SaveProductState> {
  const ctx = demoContext();
  const productId = String(formData.get("productId") ?? "");
  const existing = getProductWithDetails(ctx, productId);
  if (!existing) {
    return { ok: false, message: "Product not found." };
  }

  const status = String(formData.get("status") ?? existing.product.status) as ProductStatus;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const product: Product = {
    ...existing.product,
    name: String(formData.get("name") ?? existing.product.name),
    slug: String(formData.get("slug") ?? existing.product.slug),
    description: String(formData.get("description") ?? existing.product.description),
    categorySlug: String(formData.get("categorySlug") ?? existing.product.categorySlug),
    status,
    tags,
    seoTitle: String(formData.get("seoTitle") ?? existing.product.seoTitle ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? existing.product.seoDescription ?? ""),
  };

  const variantIds = String(formData.get("variantIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const variants: ProductVariant[] = variantIds.map((id) => {
    const base = existing.variants.find((v) => v.id === id);
    return {
      id,
      organizationId: ctx.organizationId,
      productId,
      name: String(formData.get(`variant_${id}_name`) ?? base?.name ?? ""),
      sku: String(formData.get(`variant_${id}_sku`) ?? base?.sku ?? ""),
      price: Number(formData.get(`variant_${id}_price`) ?? base?.price ?? 0),
      compareAtPrice: Number(formData.get(`variant_${id}_compareAtPrice`) ?? base?.compareAtPrice ?? 0) || undefined,
      stock: Number(formData.get(`variant_${id}_stock`) ?? base?.stock ?? 0),
      status: (base?.status ?? "active") as "active" | "archived",
    };
  });

  const media: ProductMedia[] = existing.media;

  const result = commerce.catalog.upsertProduct(ctx, product, variants, media);
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
  revalidatePath("/");

  return { ok: true, message: "Product saved." };
}
