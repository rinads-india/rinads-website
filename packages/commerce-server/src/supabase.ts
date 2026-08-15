import type { CommerceRepository, CommerceStore } from "@rinads/commerce";
import { createOrgScopedCommerceRepository, seedOrgCommerceStore } from "./org-scoped";

/** Minimal Supabase client surface for commerce persistence. */
export type CommerceSupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
    upsert: (rows: Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
  };
};

export type SupabaseCommerceOptions = {
  organizationId: string;
  client?: CommerceSupabaseClient;
  initialStore?: CommerceStore;
};

/**
 * Org-scoped commerce repository with optional Supabase sync on saveStore.
 * Full table mapping is incremental — business logic stays in domain services.
 */
export function createSupabaseCommerceRepository(options: SupabaseCommerceOptions): CommerceRepository {
  const base = options.initialStore
    ? seedOrgCommerceStore(options.organizationId, options.initialStore)
    : createOrgScopedCommerceRepository(options.organizationId);

  if (!options.client) return base;

  const client = options.client;
  const orgId = options.organizationId;

  return {
    getStore: () => base.getStore(),
    saveStore: (store) => {
      base.saveStore(store);
      void syncCommerceToSupabase(client, orgId, store);
    },
    nextId: (prefix) => base.nextId(prefix),
    nextOrderNumber: (oid) => base.nextOrderNumber(oid),
  };
}

async function syncCommerceToSupabase(
  client: CommerceSupabaseClient,
  orgId: string,
  store: CommerceStore
): Promise<void> {
  const orgProducts = store.products.filter((p) => p.organizationId === orgId);
  if (orgProducts.length) {
    await client.from("products").upsert(
      orgProducts.map((p) => ({
        id: p.id,
        organization_id: orgId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        status: p.status,
        category_slug: p.categorySlug,
        tags: p.tags,
        seo_title: p.seoTitle ?? null,
        seo_description: p.seoDescription ?? null,
        rating_avg: p.ratingAvg,
        rating_count: p.ratingCount,
      }))
    );
  }

  const orgVariants = store.variants.filter((v) => v.organizationId === orgId);
  if (orgVariants.length) {
    await client.from("product_variants").upsert(
      orgVariants.map((v) => ({
        id: v.id,
        organization_id: orgId,
        product_id: v.productId,
        name: v.name,
        sku: v.sku,
        price: v.price,
        compare_at_price: v.compareAtPrice ?? null,
        stock: v.stock,
        weight_grams: v.weightGrams ?? null,
        status: v.status,
      }))
    );
  }
}

export async function loadCommerceStoreFromSupabase(
  client: CommerceSupabaseClient,
  organizationId: string
): Promise<CommerceStore | null> {
  const { data: products, error: pErr } = await client
    .from("products")
    .select("*")
    .eq("organization_id", organizationId);
  if (pErr || !products?.length) return null;

  const { data: variants } = await client
    .from("product_variants")
    .select("*")
    .eq("organization_id", organizationId);

  return {
    products: products.map((row) => ({
      id: String(row.id),
      organizationId,
      name: String(row.name),
      slug: String(row.slug),
      description: String(row.description ?? ""),
      status: row.status as CommerceStore["products"][0]["status"],
      categorySlug: String(row.category_slug ?? ""),
      tags: (row.tags as string[]) ?? [],
      seoTitle: row.seo_title ? String(row.seo_title) : undefined,
      seoDescription: row.seo_description ? String(row.seo_description) : undefined,
      ratingAvg: Number(row.rating_avg ?? 0),
      ratingCount: Number(row.rating_count ?? 0),
    })),
    variants: (variants ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      productId: String(row.product_id),
      name: String(row.name),
      sku: String(row.sku),
      price: Number(row.price),
      compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
      stock: Number(row.stock ?? 0),
      weightGrams: row.weight_grams != null ? Number(row.weight_grams) : undefined,
      status: row.status as "active" | "archived",
    })),
    media: [],
    carts: [],
    orders: [],
    customers: [],
    addresses: [],
    shippingMethods: [],
    promotions: [],
    reviews: [],
    wishlists: [],
    productViews: [],
    tickets: [],
    taxRatePercent: 5,
  };
}
