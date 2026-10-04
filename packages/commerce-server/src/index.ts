import {
  CartService,
  CatalogService,
  CheckoutService,
  OrderService,
  PersonalizationService,
  PromotionService,
  ShippingService,
  SupportService,
  TaxService,
  type CommerceContext,
} from "@rinads/commerce";
import { getSharedCommerceRepository, AMBADY_ORG_ID, DEMO_CUSTOMER_ID } from "./memory";
import { createLegacyVariantStockInventoryPort } from "./legacy-inventory";

const repo = getSharedCommerceRepository();
const legacyInventory = createLegacyVariantStockInventoryPort(repo);

/**
 * Standalone commerce-server remains a demo/compatibility surface.
 * Production storefront/operations wiring uses @rinads/operations-server,
 * where StockLedgerService is the authoritative InventoryPort.
 */
export const commerce = {
  repo,
  catalog: new CatalogService(repo),
  cart: new CartService(repo, legacyInventory),
  checkout: new CheckoutService(repo, legacyInventory),
  order: new OrderService(repo),
  tax: new TaxService(repo),
  shipping: new ShippingService(repo),
  promotion: new PromotionService(repo),
  support: new SupportService(repo),
  personalization: new PersonalizationService(repo),
};

export function demoContext(overrides: Partial<CommerceContext> = {}): CommerceContext {
  return {
    organizationId: AMBADY_ORG_ID,
    customerId: DEMO_CUSTOMER_ID,
    userId: "user_demo_001",
    requestId: `req_${Date.now()}`,
    ...overrides,
  };
}

export { createLegacyVariantStockInventoryPort } from "./legacy-inventory";
export { createInMemoryRepository, getSharedCommerceRepository, resetCommerceStore, AMBADY_ORG_ID, DEMO_CUSTOMER_ID } from "./memory";
export { createAmbadySeedStore } from "./seed";
export { createGenericRetailSeedStore } from "./generic-retail-seed";
export {
  createOrgScopedCommerceRepository,
  seedOrgCommerceStore,
  resetOrgCommerceStores,
  getOrgCommerceStore,
} from "./org-scoped";
export {
  createSupabaseCommerceRepository,
  loadCommerceStoreFromSupabase,
  type CommerceSupabaseClient,
} from "./supabase";
