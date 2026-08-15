import type { CommerceStore } from "@rinads/commerce";

/** Minimal generic retail vertical — single location, basic catalog. */
export function createGenericRetailSeedStore(organizationId: string): CommerceStore {
  const productId = "prod_generic_001";
  const variantId = "var_generic_item";

  return {
    taxRatePercent: 18,
    products: [
      {
        id: productId,
        organizationId,
        name: "Sample Product",
        slug: "sample-product",
        description: "A starter product for your retail store.",
        status: "published",
        categorySlug: "general",
        tags: ["sample", "retail"],
        ratingAvg: 0,
        ratingCount: 0,
      },
    ],
    variants: [
      {
        id: variantId,
        organizationId,
        productId,
        name: "Default",
        sku: "SKU-001",
        price: 499,
        stock: 50,
        status: "active",
      },
    ],
    media: [],
    carts: [],
    orders: [],
    customers: [],
    addresses: [],
    shippingMethods: [
      {
        id: "ship_standard",
        organizationId,
        code: "standard",
        name: "Standard Shipping",
        baseRate: 59,
        freeAbove: 999,
        isActive: true,
      },
    ],
    promotions: [],
    reviews: [],
    wishlists: [],
    productViews: [],
    tickets: [],
  };
}
