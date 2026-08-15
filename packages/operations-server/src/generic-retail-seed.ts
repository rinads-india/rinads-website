import type { OperationsStore } from "@rinads/operations";

export function createGenericRetailOperationsSeed(organizationId: string): OperationsStore {
  const now = new Date().toISOString();
  const locationId = "loc_retail_main";

  return {
    variantProfiles: [
      {
        variantId: "var_generic_item",
        organizationId,
        unitOfMeasure: "piece",
        reorderPoint: 10,
        reorderQuantity: 50,
        stockTracking: true,
      },
    ],
    locations: [
      {
        id: locationId,
        organizationId,
        name: "Main Store",
        code: "MAIN",
        isDefault: true,
        isSellable: true,
        status: "active",
        createdAt: now,
      },
    ],
    movements: [
      {
        id: "mov_open_generic",
        organizationId,
        variantId: "var_generic_item",
        locationId,
        quantityDelta: 50,
        movementType: "opening_balance",
        reason: "Opening balance",
        createdAt: now,
      },
    ],
    reservations: [],
    transfers: [],
    transferLines: [],
    suppliers: [],
    supplierProducts: [],
    purchaseApprovalRules: [],
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
