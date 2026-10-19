"use server";

import { revalidatePath } from "next/cache";
import type { Product, ProductMedia, ProductStatus, ProductVariant } from "@rinads/commerce";
import { commerce, demoContext, getProductWithDetails } from "@/lib/commerce";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { getCommerceContextFromTenancy, isDemoMode } from "@/lib/tenancy";
import { asJewelleryDb, assertDbResult, assertDbWrite } from "@/lib/jewellery-db";

export type SaveProductState = {
  ok: boolean;
  message?: string;
};

type ProductRow = {
  id: string;
  organization_id: string;
  status: string;
};

type VariantRow = {
  id: string;
  organization_id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
};

const PRODUCT_STATUSES = new Set<ProductStatus>(["draft", "published", "archived"]);

function text(formData: FormData, key: string, fallback = ""): string {
  return String(formData.get(key) ?? fallback).trim();
}

function optionalMoney(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a finite non-negative amount.`);
  }
  return value;
}

function requiredMoney(formData: FormData, key: string): number {
  const value = optionalMoney(formData, key);
  if (value === null) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

async function saveDemoProduct(formData: FormData): Promise<SaveProductState> {
  const ctx = demoContext();
  const productId = text(formData, "productId");
  const existing = getProductWithDetails(ctx, productId);
  if (!existing) {
    return { ok: false, message: "Product not found." };
  }

  const rawStatus = text(formData, "status", existing.product.status);
  const status = PRODUCT_STATUSES.has(rawStatus as ProductStatus)
    ? (rawStatus as ProductStatus)
    : existing.product.status;
  const tags = text(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const product: Product = {
    ...existing.product,
    name: text(formData, "name", existing.product.name),
    slug: text(formData, "slug", existing.product.slug),
    description: text(formData, "description", existing.product.description),
    categorySlug: text(formData, "categorySlug", existing.product.categorySlug),
    status,
    tags,
    seoTitle: text(formData, "seoTitle", existing.product.seoTitle ?? ""),
    seoDescription: text(formData, "seoDescription", existing.product.seoDescription ?? ""),
  };

  const variantIds = text(formData, "variantIds")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const variants: ProductVariant[] = variantIds.map((id) => {
    const base = existing.variants.find((variant) => variant.id === id);
    return {
      id,
      organizationId: ctx.organizationId,
      productId,
      name: text(formData, `variant_${id}_name`, base?.name ?? ""),
      sku: text(formData, `variant_${id}_sku`, base?.sku ?? ""),
      price: Number(formData.get(`variant_${id}_price`) ?? base?.price ?? 0),
      compareAtPrice:
        Number(formData.get(`variant_${id}_compareAtPrice`) ?? base?.compareAtPrice ?? 0) || undefined,
      stock: Number(formData.get(`variant_${id}_stock`) ?? base?.stock ?? 0),
      status: (base?.status ?? "active") as "active" | "archived",
    };
  });

  const media: ProductMedia[] = existing.media;
  const result = commerce.catalog.upsertProduct(ctx, product, variants, media);
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  return { ok: true, message: "Demo product saved." };
}

async function saveProductionProduct(formData: FormData): Promise<SaveProductState> {
  const supabase = await createOwnerServerClient();
  const ctx = await getCommerceContextFromTenancy(async () => supabase);
  const db = asJewelleryDb(supabase);
  const productId = text(formData, "productId");
  if (!productId) return { ok: false, message: "Product ID is required." };

  const rawStatus = text(formData, "status");
  if (!PRODUCT_STATUSES.has(rawStatus as ProductStatus)) {
    return { ok: false, message: "Invalid product status." };
  }

  const productRows = assertDbResult(
    await db
      .from<ProductRow>("products")
      .select("id,organization_id,status")
      .eq("organization_id", ctx.organizationId)
      .eq("id", productId)
      .limit(1),
    "Load product before update"
  );
  if (!productRows.length) {
    return { ok: false, message: "Product not found in the active organization." };
  }

  const variantIds = [...new Set(
    text(formData, "variantIds")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  )];

  const existingVariants = variantIds.length
    ? assertDbResult(
        await db
          .from<VariantRow>("product_variants")
          .select("id,organization_id,product_id,name,sku,price,compare_at_price")
          .eq("organization_id", ctx.organizationId)
          .eq("product_id", productId)
          .in("id", variantIds),
        "Load variants before update"
      )
    : [];

  if (existingVariants.length !== variantIds.length) {
    return { ok: false, message: "One or more variants do not belong to this product/organization." };
  }

  const name = text(formData, "name");
  const slug = text(formData, "slug");
  if (!name || !slug) {
    return { ok: false, message: "Product name and slug are required." };
  }

  const tags = text(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  assertDbWrite(
    await db
      .from("products")
      .update({
        name,
        slug,
        description: text(formData, "description"),
        category_slug: text(formData, "categorySlug"),
        status: rawStatus,
        tags,
        seo_title: text(formData, "seoTitle") || null,
        seo_description: text(formData, "seoDescription") || null,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", ctx.organizationId)
      .eq("id", productId),
    "Update product"
  );

  const variantById = new Map(existingVariants.map((variant) => [variant.id, variant]));
  for (const variantId of variantIds) {
    const existing = variantById.get(variantId);
    if (!existing) continue;

    const variantName = text(formData, `variant_${variantId}_name`, existing.name);
    const sku = text(formData, `variant_${variantId}_sku`, existing.sku);
    if (!variantName || !sku) {
      return { ok: false, message: `Variant ${variantId} requires a name and SKU.` };
    }

    const price = requiredMoney(formData, `variant_${variantId}_price`);
    const compareAtPrice = optionalMoney(formData, `variant_${variantId}_compareAtPrice`);

    assertDbWrite(
      await db
        .from("product_variants")
        .update({
          name: variantName,
          sku,
          price,
          compare_at_price: compareAtPrice,
        })
        .eq("organization_id", ctx.organizationId)
        .eq("product_id", productId)
        .eq("id", variantId),
      `Update variant ${variantId}`
    );
  }

  return { ok: true, message: "Product saved to the active production tenant. Stock was not overwritten." };
}

export async function saveProduct(
  _prev: SaveProductState,
  formData: FormData
): Promise<SaveProductState> {
  try {
    const result = isDemoMode()
      ? await saveDemoProduct(formData)
      : await saveProductionProduct(formData);

    if (result.ok) {
      const productId = text(formData, "productId");
      revalidatePath("/products");
      revalidatePath(`/products/${productId}/edit`);
      revalidatePath("/jewellery");
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save product.",
    };
  }
}
