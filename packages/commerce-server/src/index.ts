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

const repo = getSharedCommerceRepository();

export const commerce = {
  repo,
  catalog: new CatalogService(repo),
  cart: new CartService(repo),
  checkout: new CheckoutService(repo),
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

export { createInMemoryRepository, getSharedCommerceRepository, resetCommerceStore, AMBADY_ORG_ID, DEMO_CUSTOMER_ID } from "./memory";
export { createAmbadySeedStore } from "./seed";
