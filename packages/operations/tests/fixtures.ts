import type { OperationsStore } from "../src/repository";

export function createTestOperationsStore(): OperationsStore {
  const orgId = "org_ambady_demo";
  const now = new Date().toISOString();
  return {
    variantProfiles: [
      {
        variantId: "var_pebbles_500g",
        organizationId: orgId,
        unitOfMeasure: "pack",
        reorderPoint: 20,
        reorderQuantity: 100,
        stockTracking: true,
      },
    ],
    locations: [
      {
        id: "loc_main_store",
        organizationId: orgId,
        name: "Main Store",
        code: "MAIN",
        isDefault: true,
        isSellable: true,
        status: "active",
        createdAt: now,
      },
      {
        id: "loc_warehouse",
        organizationId: orgId,
        name: "Warehouse",
        code: "WH",
        isDefault: false,
        isSellable: true,
        status: "active",
        createdAt: now,
      },
    ],
    movements: [
      {
        id: "mov_open",
        organizationId: orgId,
        variantId: "var_pebbles_500g",
        locationId: "loc_main_store",
        quantityDelta: 120,
        movementType: "opening_balance",
        createdAt: now,
      },
      {
        id: "mov_open_5kg",
        organizationId: orgId,
        variantId: "var_pebbles_5kg",
        locationId: "loc_main_store",
        quantityDelta: 32,
        movementType: "opening_balance",
        createdAt: now,
      },
    ],
    reservations: [],
    transfers: [],
    transferLines: [],
    suppliers: [
      {
        id: "sup_pebble_co",
        organizationId: orgId,
        name: "Kerala Pebble Co.",
        status: "active",
        createdAt: now,
      },
    ],
    supplierProducts: [],
    purchaseApprovalRules: [
      {
        id: "par_default",
        organizationId: orgId,
        name: "Default",
        maxAmountWithoutOwnerApproval: 5000,
        requiresOwnerAbove: 25000,
        isActive: true,
      },
    ],
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
    expenseCategories: [],
    expenses: [],
    documentSequences: [],
    businessEvents: [],
    auditLogs: [],
  };
}
