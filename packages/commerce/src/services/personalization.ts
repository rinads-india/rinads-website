import type { CommerceRepository } from "../repository";
import type { CommerceContext, ProductCard } from "../types";
import { CatalogService } from "./catalog";

export type PersonalizationSignal = {
  productId: string;
  viewedAt: string;
};

/** Wraps memory signals; falls back to global popularity when data is thin. */
export class PersonalizationService {
  private catalog: CatalogService;

  constructor(private readonly repo: CommerceRepository) {
    this.catalog = new CatalogService(repo);
  }

  recordView(ctx: CommerceContext, productId: string): void {
    const store = this.repo.getStore();
    store.productViews.push({
      customerId: ctx.customerId,
      productId,
      viewedAt: new Date().toISOString(),
    });
    this.repo.saveStore(store);
  }

  recommendations(ctx: CommerceContext, limit = 4): ProductCard[] {
    const store = this.repo.getStore();
    const published = this.catalog.listPublished(ctx);
    if (!ctx.customerId) {
      return [...published].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, limit);
    }
    const views = store.productViews.filter((v) => v.customerId === ctx.customerId);
    if (views.length === 0) {
      return [...published].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, limit);
    }
    const viewedIds = new Set(views.map((v) => v.productId));
    const categories = new Set(
      published.filter((p) => viewedIds.has(p.id)).map((p) => p.categorySlug)
    );
    const related = published.filter((p) => !viewedIds.has(p.id) && categories.has(p.categorySlug));
    if (related.length >= limit) return related.slice(0, limit);
    const filler = published.filter((p) => !viewedIds.has(p.id) && !related.includes(p));
    return [...related, ...filler].slice(0, limit);
  }
}
