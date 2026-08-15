import type { CommerceStore } from "@rinads/commerce";
import type { OperationsStore } from "@rinads/operations";
import { createAmbadySeedStore } from "@rinads/commerce-server";
import { createAmbadyOperationsSeed } from "@rinads/operations-server";

export type VerticalTemplateKey = "ambady-nursery";

export type TenantSeedBundle = {
  commerce: CommerceStore;
  operations: OperationsStore;
};

export const VERTICAL_TEMPLATES: Record<VerticalTemplateKey, { name: string; description: string }> = {
  "ambady-nursery": {
    name: "Ambady Nursery & Garden",
    description: "Pebbles, landscaping products, full ERP starter catalog and inventory.",
  },
};

function remapCommerceStore(store: CommerceStore, organizationId: string): CommerceStore {
  return {
    ...store,
    products: store.products.map((p) => ({ ...p, organizationId })),
    variants: store.variants.map((v) => ({ ...v, organizationId })),
    shippingMethods: store.shippingMethods.map((s) => ({ ...s, organizationId })),
    promotions: store.promotions.map((p) => ({ ...p, organizationId })),
    customers: store.customers.map((c) => ({ ...c, organizationId })),
    addresses: store.addresses.map((a) => ({ ...a, organizationId })),
    carts: [],
    orders: [],
    reviews: [],
    wishlists: [],
    productViews: [],
    tickets: [],
  };
}

function remapOperationsStore(store: OperationsStore, organizationId: string): OperationsStore {
  const idPrefix = organizationId.slice(0, 8);
  return {
    ...store,
    variantProfiles: store.variantProfiles.map((p) => ({ ...p, organizationId })),
    locations: store.locations.map((l) => ({
      ...l,
      organizationId,
      id: l.id.replace("loc_", `loc_${idPrefix}_`),
    })),
    movements: store.movements.map((m) => ({
      ...m,
      organizationId,
      locationId: m.locationId.replace("loc_", `loc_${idPrefix}_`),
    })),
    suppliers: store.suppliers.map((s) => ({ ...s, organizationId })),
    supplierProducts: store.supplierProducts.map((s) => ({ ...s, organizationId })),
    purchaseApprovalRules: store.purchaseApprovalRules.map((r) => ({ ...r, organizationId })),
    expenseCategories: store.expenseCategories.map((c) => ({ ...c, organizationId })),
    documentSequences: store.documentSequences.map((d) => ({ ...d, organizationId })),
    reservations: [],
    transfers: [],
    transferLines: [],
    purchaseOrders: [],
    purchaseOrderLines: [],
    goodsReceipts: [],
    goodsReceiptLines: [],
    fulfilments: [],
    pickLists: [],
    pickListLines: [],
    packages: [],
    shipments: [],
    deliveryEvents: [],
    returnRequests: [],
    returnLines: [],
    refunds: [],
    tasks: [],
    alerts: [],
    priceHistory: [],
    expenses: [],
    businessEvents: [],
    auditLogs: [],
  };
}

export function seedTenantBundle(
  organizationId: string,
  templateKey: VerticalTemplateKey = "ambady-nursery"
): TenantSeedBundle {
  if (templateKey !== "ambady-nursery") {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  const commerce = remapCommerceStore(createAmbadySeedStore(), organizationId);
  const operations = remapOperationsStore(createAmbadyOperationsSeed(), organizationId);

  return { commerce, operations };
}

/** Ambady Tenant #1 canonical slug */
export const AMBADY_TENANT_SLUG = "ambady";
