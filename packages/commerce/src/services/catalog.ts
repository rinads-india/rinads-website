import type { CommerceRepository } from "../repository";
import { err, ok } from "../result";
import type {
  CommerceContext,
  Product,
  ProductCard,
  ProductMedia,
  ProductVariant,
  Result,
  SearchFilters,
  SearchSort,
} from "../types";

export class CatalogService {
  constructor(private readonly repo: CommerceRepository) {}

  listPublished(ctx: CommerceContext): ProductCard[] {
    const store = this.repo.getStore();
    return store.products
      .filter((p) => p.organizationId === ctx.organizationId && p.status === "published")
      .map((p) => this.toCard(p, store));
  }

  getBySlug(ctx: CommerceContext, slug: string): Result<ProductCard & { media: ProductMedia[] }> {
    const store = this.repo.getStore();
    const product = store.products.find(
      (p) => p.organizationId === ctx.organizationId && p.slug === slug && p.status === "published"
    );
    if (!product) return err("PRODUCT_NOT_FOUND", "Product not found.");
    const media = store.media.filter((m) => m.productId === product.id).sort((a, b) => a.sortOrder - b.sortOrder);
    return ok({ ...this.toCard(product, store), media });
  }

  getVariant(ctx: CommerceContext, variantId: string): ProductVariant | undefined {
    return this.repo
      .getStore()
      .variants.find((v) => v.organizationId === ctx.organizationId && v.id === variantId && v.status === "active");
  }

  search(
    ctx: CommerceContext,
    query: string,
    filters: SearchFilters = {},
    sort: SearchSort = "relevance"
  ): ProductCard[] {
    const q = query.trim().toLowerCase();
    let items = this.listPublished(ctx);
    if (q) {
      items = items.filter((p) => {
        const hay = [p.name, p.description, p.categorySlug, ...p.tags, ...p.variants.map((v) => v.sku)].join(" ").toLowerCase();
        return hay.includes(q) || p.name.toLowerCase().includes(q);
      });
    }
    if (filters.categorySlug) items = items.filter((p) => p.categorySlug === filters.categorySlug);
    if (filters.inStockOnly) items = items.filter((p) => p.inStock);
    if (filters.minPrice != null) items = items.filter((p) => p.minPrice >= filters.minPrice!);
    if (filters.maxPrice != null) items = items.filter((p) => p.maxPrice <= filters.maxPrice!);
    if (filters.tags?.length) {
      items = items.filter((p) => filters.tags!.some((t) => p.tags.includes(t)));
    }
    return sortProducts(items, sort, q);
  }

  relatedProducts(ctx: CommerceContext, productId: string, limit = 4): ProductCard[] {
    const store = this.repo.getStore();
    const base = store.products.find((p) => p.id === productId);
    if (!base) return [];
    return this.listPublished(ctx)
      .filter((p) => p.id !== productId && p.categorySlug === base.categorySlug)
      .slice(0, limit);
  }

  upsertProduct(ctx: CommerceContext, product: Product, variants: ProductVariant[], media: ProductMedia[]): Result<Product> {
    const store = this.repo.getStore();
    if (product.organizationId !== ctx.organizationId) return err("FORBIDDEN", "Tenant mismatch.");
    const slugClash = store.products.some(
      (p) => p.organizationId === ctx.organizationId && p.slug === product.slug && p.id !== product.id
    );
    if (slugClash) return err("SLUG_EXISTS", "Slug must be unique.", { slug: "Already in use." });
    const idx = store.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) store.products[idx] = product;
    else store.products.push(product);
    store.variants = store.variants.filter((v) => v.productId !== product.id).concat(variants);
    store.media = store.media.filter((m) => m.productId !== product.id).concat(media);
    this.repo.saveStore(store);
    return ok(product);
  }

  private toCard(product: Product, store: ReturnType<CommerceRepository["getStore"]>): ProductCard {
    const variants = store.variants.filter((v) => v.productId === product.id && v.status === "active");
    const prices = variants.map((v) => v.price);
    const primary = store.media.find((m) => m.productId === product.id && m.isPrimary) ?? store.media.find((m) => m.productId === product.id);
    return {
      ...product,
      variants,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      inStock: variants.some((v) => v.stock > 0),
      primaryImageUrl: primary?.url,
    };
  }
}

function sortProducts(items: ProductCard[], sort: SearchSort, query: string): ProductCard[] {
  const copy = [...items];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.minPrice - b.minPrice);
    case "price_desc":
      return copy.sort((a, b) => b.minPrice - a.minPrice);
    case "rating":
      return copy.sort((a, b) => b.ratingAvg - a.ratingAvg);
    case "popular":
      return copy.sort((a, b) => b.ratingCount - a.ratingCount);
    case "newest":
      return copy.reverse();
    default:
      if (!query) return copy;
      return copy.sort((a, b) => score(a, query) - score(b, query)).reverse();
  }
}

function score(p: ProductCard, q: string): number {
  let s = 0;
  if (p.name.toLowerCase() === q) s += 100;
  if (p.name.toLowerCase().startsWith(q)) s += 50;
  if (p.name.toLowerCase().includes(q)) s += 20;
  if (p.tags.some((t) => t.includes(q))) s += 10;
  return s;
}
