import type { OperationsStore } from "@rinads/operations";
import { AMBADY_ORG_ID } from "@rinads/commerce-server";

export { AMBADY_ORG_ID };

const MAIN_STORE = "loc_main_store";
const WAREHOUSE = "loc_warehouse";
const DAMAGED = "loc_damaged";

export function createAmbadyOperationsSeed(): OperationsStore {
  const orgId = AMBADY_ORG_ID;
  const now = new Date().toISOString();

  return {
    variantProfiles: [
      {
        variantId: "var_pebbles_500g",
        organizationId: orgId,
        barcode: "8901234567890",
        costPrice: 89,
        unitOfMeasure: "pack",
        reorderPoint: 20,
        reorderQuantity: 100,
        minimumStock: 10,
        maximumStock: 200,
        stockTracking: true,
      },
      {
        variantId: "var_pebbles_1kg",
        organizationId: orgId,
        barcode: "8901234567891",
        costPrice: 165,
        unitOfMeasure: "pack",
        reorderPoint: 15,
        reorderQuantity: 80,
        minimumStock: 8,
        stockTracking: true,
      },
      {
        variantId: "var_pebbles_5kg",
        organizationId: orgId,
        barcode: "8901234567892",
        costPrice: 720,
        unitOfMeasure: "pack",
        reorderPoint: 8,
        reorderQuantity: 40,
        minimumStock: 4,
        stockTracking: true,
      },
      {
        variantId: "var_river_2kg",
        organizationId: orgId,
        costPrice: 240,
        unitOfMeasure: "pack",
        reorderPoint: 10,
        reorderQuantity: 50,
        stockTracking: true,
      },
      {
        variantId: "var_gravel_1kg",
        organizationId: orgId,
        costPrice: 120,
        unitOfMeasure: "pack",
        stockTracking: true,
      },
    ],
    locations: [
      {
        id: MAIN_STORE,
        organizationId: orgId,
        name: "Main Store",
        code: "MAIN",
        isDefault: true,
        isSellable: true,
        status: "active",
        createdAt: now,
      },
      {
        id: WAREHOUSE,
        organizationId: orgId,
        name: "Warehouse",
        code: "WH",
        isDefault: false,
        isSellable: true,
        status: "active",
        createdAt: now,
      },
      {
        id: DAMAGED,
        organizationId: orgId,
        name: "Damaged Area",
        code: "DMG",
        isDefault: false,
        isSellable: false,
        status: "active",
        createdAt: now,
      },
    ],
    movements: [
      { id: "mov_open_500", organizationId: orgId, variantId: "var_pebbles_500g", locationId: MAIN_STORE, quantityDelta: 120, movementType: "opening_balance", reason: "Opening balance", createdAt: now },
      { id: "mov_open_1kg", organizationId: orgId, variantId: "var_pebbles_1kg", locationId: MAIN_STORE, quantityDelta: 85, movementType: "opening_balance", reason: "Opening balance", createdAt: now },
      { id: "mov_open_5kg", organizationId: orgId, variantId: "var_pebbles_5kg", locationId: MAIN_STORE, quantityDelta: 32, movementType: "opening_balance", reason: "Opening balance", createdAt: now },
      { id: "mov_open_river", organizationId: orgId, variantId: "var_river_2kg", locationId: MAIN_STORE, quantityDelta: 45, movementType: "opening_balance", reason: "Opening balance", createdAt: now },
    ],
    reservations: [],
    transfers: [],
    transferLines: [],
    suppliers: [
      {
        id: "sup_pebble_co",
        organizationId: orgId,
        name: "Kerala Pebble Co.",
        contactName: "Rajesh Kumar",
        phone: "+919876543211",
        email: "orders@keralapebble.local",
        address: "Industrial Estate, Aluva, Kerala",
        gstin: "32AABCK1234A1Z5",
        paymentTerms: "Net 30",
        status: "active",
        createdAt: now,
      },
    ],
    supplierProducts: [
      {
        id: "sp_500",
        organizationId: orgId,
        supplierId: "sup_pebble_co",
        variantId: "var_pebbles_500g",
        supplierSku: "KP-500",
        cost: 85,
        moq: 50,
        leadTimeDays: 7,
        isPreferred: true,
      },
    ],
    purchaseApprovalRules: [
      {
        id: "par_default",
        organizationId: orgId,
        name: "Default approval",
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
    expenseCategories: [
      { id: "ec_rent", organizationId: orgId, name: "Rent", slug: "rent", isActive: true },
      { id: "ec_util", organizationId: orgId, name: "Utilities", slug: "utilities", isActive: true },
      { id: "ec_ship", organizationId: orgId, name: "Shipping", slug: "shipping", isActive: true },
      { id: "ec_pack", organizationId: orgId, name: "Packaging", slug: "packaging", isActive: true },
    ],
    expenses: [],
    documentSequences: [
      { id: "ds_po", organizationId: orgId, documentType: "purchase_order", prefix: "PO", nextNumber: 1000 },
      { id: "ds_gr", organizationId: orgId, documentType: "goods_receipt", prefix: "GR", nextNumber: 1000 },
      { id: "ds_xfr", organizationId: orgId, documentType: "transfer", prefix: "XFR", nextNumber: 1000 },
    ],
    businessEvents: [],
    auditLogs: [],
  };
}

export function syncCommerceStockFromLedger(
  commerceStore: import("@rinads/commerce").CommerceStore,
  ledger: import("@rinads/operations").StockLedgerService,
  orgId: string
): void {
  const ctx = { organizationId: orgId };
  for (const variant of commerceStore.variants) {
    if (variant.organizationId === orgId) {
      variant.stock = ledger.getAvailable(ctx, variant.id);
    }
  }
}
