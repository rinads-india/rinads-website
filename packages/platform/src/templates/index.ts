import type { CommerceStore } from "@rinads/commerce";
import type { OperationsStore } from "@rinads/operations";
import { createAmbadySeedStore, createGenericRetailSeedStore } from "@rinads/commerce-server";
import { createAmbadyOperationsSeed, createGenericRetailOperationsSeed } from "@rinads/operations-server";

export type VerticalTemplateKey = "ambady-nursery" | "generic-retail";

export type TenantSeedBundle = {
  commerce: CommerceStore;
  operations: OperationsStore;
};

export type VerticalTemplateMeta = {
  key: VerticalTemplateKey;
  name: string;
  description: string;
  category: string;
  isPublished: boolean;
};

export const VERTICAL_TEMPLATES: Record<VerticalTemplateKey, Omit<VerticalTemplateMeta, "key">> = {
  "ambady-nursery": {
    name: "Ambady Nursery & Garden",
    description: "Pebbles, landscaping products, full ERP starter catalog and inventory.",
    category: "nursery",
    isPublished: true,
  },
  "generic-retail": {
    name: "Generic Retail",
    description: "Minimal catalog, single location, basic shipping for general retail.",
    category: "retail",
    isPublished: true,
  },
};

export type TemplateRegistryClient = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string | boolean
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

/** Load published templates from DB with code fallback. */
export async function loadPublishedTemplates(
  client?: TemplateRegistryClient
): Promise<VerticalTemplateMeta[]> {
  if (client) {
    const { data, error } = await client
      .from("vertical_templates")
      .select("*")
      .eq("is_published", true);
    if (!error && data?.length) {
      return data.map((row) => ({
        key: String(row.key) as VerticalTemplateKey,
        name: String(row.name),
        description: String(row.description ?? ""),
        category: String(row.category ?? "retail"),
        isPublished: Boolean(row.is_published),
      }));
    }
  }

  return (Object.entries(VERTICAL_TEMPLATES) as [VerticalTemplateKey, (typeof VERTICAL_TEMPLATES)[VerticalTemplateKey]][])
    .filter(([, meta]) => meta.isPublished)
    .map(([key, meta]) => ({ key, ...meta }));
}

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
      id: l.id.startsWith("loc_") ? l.id.replace(/^loc_/, `loc_${idPrefix}_`) : l.id,
    })),
    movements: store.movements.map((m) => ({
      ...m,
      organizationId,
      locationId: m.locationId.startsWith("loc_")
        ? m.locationId.replace(/^loc_/, `loc_${idPrefix}_`)
        : m.locationId,
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

function seedForTemplate(templateKey: VerticalTemplateKey, organizationId: string): TenantSeedBundle {
  if (templateKey === "generic-retail") {
    return {
      commerce: remapCommerceStore(createGenericRetailSeedStore(organizationId), organizationId),
      operations: remapOperationsStore(createGenericRetailOperationsSeed(organizationId), organizationId),
    };
  }
  return {
    commerce: remapCommerceStore(createAmbadySeedStore(), organizationId),
    operations: remapOperationsStore(createAmbadyOperationsSeed(), organizationId),
  };
}

export function seedTenantBundle(
  organizationId: string,
  templateKey: VerticalTemplateKey = "ambady-nursery"
): TenantSeedBundle {
  if (!(templateKey in VERTICAL_TEMPLATES)) {
    throw new Error(`Unknown template: ${templateKey}`);
  }
  return seedForTemplate(templateKey, organizationId);
}

/** Ambady Tenant #1 canonical slug */
export const AMBADY_TENANT_SLUG = "ambady";
