export type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type OperationsContext = {
  organizationId: string;
  userId?: string;
  customerId?: string;
  requestId?: string;
  roleKey?: string;
};

export type UnitOfMeasure =
  | "piece"
  | "kg"
  | "g"
  | "sq_ft"
  | "set"
  | "pack"
  | "box"
  | "bundle"
  | "litre";

export type StockMovementType =
  | "purchase"
  | "sale"
  | "reservation"
  | "reservation_release"
  | "adjustment"
  | "damage"
  | "loss"
  | "return"
  | "transfer_in"
  | "transfer_out"
  | "opening_balance";

export type StockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "backorder"
  | "preorder"
  | "discontinued";

export type TransferStatus =
  | "draft"
  | "requested"
  | "approved"
  | "dispatched"
  | "in_transit"
  | "received"
  | "cancelled";

export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled"
  | "closed";

export type FulfilmentRecordStatus =
  | "pending"
  | "picking"
  | "picked"
  | "packing"
  | "packed"
  | "completed"
  | "cancelled";

export type ShipmentStatus =
  | "pending"
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export type DeliveryEventType =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned";

export type DeliveryExceptionType =
  | "failed_delivery"
  | "wrong_address"
  | "customer_unavailable"
  | "damaged"
  | "lost"
  | "return_to_origin";

export type ReturnRequestStatus =
  | "requested"
  | "approved"
  | "pickup_pending"
  | "received"
  | "inspected"
  | "approved_for_refund"
  | "rejected"
  | "completed";

export type ReturnReason =
  | "damaged"
  | "wrong_item"
  | "missing_item"
  | "quality_issue"
  | "customer_change_of_mind"
  | "other";

export type ReturnInventoryDisposition = "sellable" | "damaged" | "quarantine" | "discarded";

export type RefundStatus = "pending" | "approved" | "processed" | "failed" | "cancelled";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed" | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type TaskEntityType =
  | "customer"
  | "order"
  | "product"
  | "supplier"
  | "purchase_order"
  | "support_ticket"
  | "shipment"
  | "return_request";

export type CustomerSegment =
  | "new"
  | "repeat"
  | "high_value"
  | "inactive"
  | "recent_buyer"
  | "bulk_customer";

export type VariantOpsProfile = {
  variantId: string;
  organizationId: string;
  barcode?: string;
  costPrice?: number;
  unitOfMeasure: UnitOfMeasure;
  reorderPoint?: number;
  reorderQuantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  stockTracking: boolean;
};

export type InventoryLocation = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isDefault: boolean;
  isSellable: boolean;
  status: "active" | "archived";
  createdAt: string;
};

export type StockMovement = {
  id: string;
  organizationId: string;
  variantId: string;
  locationId: string;
  quantityDelta: number;
  movementType: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
  createdAt: string;
};

export type InventoryReservation = {
  id: string;
  organizationId: string;
  variantId: string;
  locationId: string;
  cartId?: string;
  orderId?: string;
  quantity: number;
  status: "active" | "converted" | "released" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type StockBalance = {
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  incoming: number;
  damaged: number;
};

export type StockTransfer = {
  id: string;
  organizationId: string;
  transferNumber: string;
  fromLocationId: string;
  toLocationId: string;
  status: TransferStatus;
  requestedBy?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type StockTransferLine = {
  id: string;
  transferId: string;
  variantId: string;
  quantity: number;
  quantityDispatched: number;
  quantityReceived: number;
};

export type Supplier = {
  id: string;
  organizationId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  paymentTerms?: string;
  status: "active" | "inactive";
  notes?: string;
  createdAt: string;
};

export type SupplierProduct = {
  id: string;
  organizationId: string;
  supplierId: string;
  variantId: string;
  supplierSku?: string;
  cost: number;
  moq?: number;
  leadTimeDays?: number;
  isPreferred: boolean;
};

export type PurchaseApprovalRule = {
  id: string;
  organizationId: string;
  name: string;
  maxAmountWithoutOwnerApproval: number;
  requiresOwnerAbove: number;
  isActive: boolean;
};

export type PurchaseOrder = {
  id: string;
  organizationId: string;
  poNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxTotal: number;
  freightCost: number;
  discountTotal: number;
  grandTotal: number;
  expectedDate?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderLine = {
  id: string;
  purchaseOrderId: string;
  variantId: string;
  quantity: number;
  quantityReceived: number;
  unitCost: number;
  taxAmount: number;
  discountAmount: number;
  expectedDate?: string;
  supplierReference?: string;
};

export type GoodsReceipt = {
  id: string;
  organizationId: string;
  receiptNumber: string;
  purchaseOrderId: string;
  locationId: string;
  receivedBy?: string;
  inspectionNotes?: string;
  createdAt: string;
};

export type GoodsReceiptLine = {
  id: string;
  goodsReceiptId: string;
  purchaseOrderLineId: string;
  variantId: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  shortQuantity: number;
  batchReference?: string;
};

export type FulfilmentRecord = {
  id: string;
  organizationId: string;
  orderId: string;
  status: FulfilmentRecordStatus;
  locationId: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
};

export type PickList = {
  id: string;
  organizationId: string;
  fulfilmentId: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  assignedTo?: string;
  createdAt: string;
};

export type PickListLine = {
  id: string;
  pickListId: string;
  orderLineId?: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  locationId: string;
  quantity: number;
  quantityPicked: number;
};

export type PackageRecord = {
  id: string;
  organizationId: string;
  orderId: string;
  fulfilmentId: string;
  packageType?: string;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  trackingReference?: string;
  packedBy?: string;
  packingNotes?: string;
  createdAt: string;
};

export type Shipment = {
  id: string;
  organizationId: string;
  orderId: string;
  packageId: string;
  carrier: string;
  service?: string;
  awb?: string;
  trackingUrl?: string;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
};

export type DeliveryEvent = {
  id: string;
  shipmentId: string;
  eventType: DeliveryEventType;
  label: string;
  occurredAt: string;
  rawPayload?: Record<string, unknown>;
};

export type ReturnRequest = {
  id: string;
  organizationId: string;
  orderId: string;
  customerId?: string;
  status: ReturnRequestStatus;
  reason: ReturnReason;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReturnLine = {
  id: string;
  returnRequestId: string;
  orderLineId?: string;
  variantId: string;
  quantity: number;
  reason: ReturnReason;
  condition?: string;
  inspectionNotes?: string;
  disposition?: ReturnInventoryDisposition;
  resolution?: string;
};

export type Refund = {
  id: string;
  organizationId: string;
  orderId: string;
  returnRequestId?: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason?: string;
  processedBy?: string;
  paymentReference?: string;
  createdAt: string;
};

export type OperationalTask = {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt?: string;
  entityType?: TaskEntityType;
  entityId?: string;
  createdAt: string;
  updatedAt: string;
};

export type OperationalAlert = {
  id: string;
  organizationId: string;
  alertType: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  severity: "info" | "warning" | "critical";
  acknowledged: boolean;
  createdAt: string;
};

export type PriceHistoryEntry = {
  id: string;
  organizationId: string;
  variantId: string;
  oldPrice: number;
  newPrice: number;
  oldCost?: number;
  newCost?: number;
  effectiveAt: string;
  operatorId?: string;
  reason?: string;
};

export type ExpenseCategory = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type Expense = {
  id: string;
  organizationId: string;
  categoryId: string;
  amount: number;
  taxAmount: number;
  vendor?: string;
  expenseDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  attachmentFileId?: string;
  createdAt: string;
};

export type DocumentSequence = {
  id: string;
  organizationId: string;
  documentType: string;
  prefix: string;
  nextNumber: number;
};

export type BusinessEvent = {
  id: string;
  organizationId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  processedAt?: string;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  organizationId: string;
  actorType: "user" | "ai" | "system";
  actorId?: string;
  approvedBy?: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  source?: string;
  reason?: string;
  createdAt: string;
};

export type WorkQueueItem = {
  id: string;
  queueType:
    | "order"
    | "pick"
    | "pack"
    | "shipment"
    | "return"
    | "support"
    | "low_stock"
    | "purchase_approval";
  title: string;
  subtitle?: string;
  entityType: string;
  entityId: string;
  priority: number;
  dueAt?: string;
  createdAt: string;
};

export type ReorderRecommendation = {
  variantId: string;
  sku: string;
  productName: string;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
  reason: string;
};

export type KpiSnapshot = {
  grossSales: number;
  netSales: number;
  orderCount: number;
  averageOrderValue: number;
  unitsSold: number;
  inventoryValue: number;
  lowStockCount: number;
  pendingFulfilment: number;
  purchaseValuePending: number;
  returnCount: number;
  refundTotal: number;
};

export type ErpSearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
};
