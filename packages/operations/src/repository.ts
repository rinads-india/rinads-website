import type {
  AuditLogEntry,
  BusinessEvent,
  DeliveryEvent,
  DocumentSequence,
  Expense,
  ExpenseCategory,
  FulfilmentRecord,
  GoodsReceipt,
  GoodsReceiptLine,
  InventoryLocation,
  InventoryReservation,
  OperationalAlert,
  OperationalTask,
  PackageRecord,
  PickList,
  PickListLine,
  PriceHistoryEntry,
  PurchaseApprovalRule,
  PurchaseOrder,
  PurchaseOrderLine,
  Refund,
  ReturnLine,
  ReturnRequest,
  Shipment,
  StockMovement,
  StockTransfer,
  StockTransferLine,
  Supplier,
  SupplierProduct,
  VariantOpsProfile,
} from "./types";

export type OperationsStore = {
  variantProfiles: VariantOpsProfile[];
  locations: InventoryLocation[];
  movements: StockMovement[];
  reservations: InventoryReservation[];
  transfers: StockTransfer[];
  transferLines: StockTransferLine[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  purchaseApprovalRules: PurchaseApprovalRule[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
  goodsReceipts: GoodsReceipt[];
  goodsReceiptLines: GoodsReceiptLine[];
  fulfilments: FulfilmentRecord[];
  pickLists: PickList[];
  pickListLines: PickListLine[];
  packages: PackageRecord[];
  shipments: Shipment[];
  deliveryEvents: DeliveryEvent[];
  returnRequests: ReturnRequest[];
  returnLines: ReturnLine[];
  refunds: Refund[];
  tasks: OperationalTask[];
  alerts: OperationalAlert[];
  priceHistory: PriceHistoryEntry[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  documentSequences: DocumentSequence[];
  businessEvents: BusinessEvent[];
  auditLogs: AuditLogEntry[];
};

export type OperationsRepository = {
  getStore(): OperationsStore;
  saveStore(store: OperationsStore): void;
  nextId(prefix: string): string;
  nextDocumentNumber(orgId: string, documentType: string, prefix: string): string;
};
