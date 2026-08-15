import type { CommerceContext, InventoryPort } from "@rinads/commerce";
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
  type Order,
} from "@rinads/commerce";
import { EventStore, JobRunner, AlertEngine, createFulfilmentProcessor } from "@rinads/runtime";
import { getSharedCommerceRepository } from "@rinads/commerce-server";
import { createInMemoryOperationsRepository } from "./memory";
import { syncCommerceStockFromLedger } from "./seed";
import {
  AuditService,
  FulfilmentService,
  GoodsReceiptService,
  InventoryLocationService,
  KpiService,
  LowStockService,
  PurchaseOrderService,
  RefundService,
  ReservationService,
  ReturnService,
  SearchService,
  ShipmentService,
  StockLedgerService,
  SupplierService,
  TaskService,
  TransferService,
  VariantOpsService,
  WorkQueueService,
  PricingService,
  ExpenseService,
  DocumentService,
  CrmOpsService,
  BarcodeService,
  type OperationsContext,
} from "@rinads/operations";

export const AMBADY_ORG_ID = "org_ambady_demo";
export const DEMO_CUSTOMER_ID = "cust_demo_001";

const commerceRepo = getSharedCommerceRepository();
const opsRepo = createInMemoryOperationsRepository();

const ledger = new StockLedgerService(opsRepo);

const inventoryPort: InventoryPort = {
  getAvailable(ctx, variantId) {
    return ledger.getAvailable(toOps(ctx), variantId);
  },
  checkAvailable(ctx, variantId, quantity) {
    return ledger.checkAvailable(toOps(ctx), variantId, quantity);
  },
  reserveForCart(ctx, cartId, lines) {
    return ledger.reserveForCart(toOps(ctx), cartId, lines);
  },
  releaseCartReservations(ctx, cartId) {
    return ledger.releaseCartReservations(toOps(ctx), cartId);
  },
  convertReservationToSale(ctx, cartId, orderId) {
    return ledger.convertReservationToSale(toOps(ctx), cartId, orderId);
  },
  refreshProjections(ctx) {
    syncCommerceStockFromLedger(commerceRepo.getStore(), ledger, ctx.organizationId);
    commerceRepo.saveStore(commerceRepo.getStore());
  },
};

function toOps(ctx: CommerceContext): OperationsContext {
  return {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    customerId: ctx.customerId,
    requestId: ctx.requestId,
  };
}

const fulfilment = new FulfilmentService(opsRepo);
const eventStore = new EventStore(opsRepo);
const alertEngine = new AlertEngine(opsRepo);
const jobRunner = new JobRunner();
jobRunner.register(createFulfilmentProcessor(fulfilment));

function handleOrderPaid(ctx: CommerceContext, order: Order): void {
  eventStore.emit(toOps(ctx), "order.paid", {
    entityType: "order",
    entityId: order.id,
    orderId: order.id,
    lines: order.lines.map((l) => ({
      orderLineId: l.id,
      variantId: l.variantId,
      sku: l.sku,
      productName: l.productName,
      variantName: l.variantName,
      quantity: l.quantity,
    })),
  });
  jobRunner.enqueue({
    organizationId: ctx.organizationId,
    processorKey: "fulfilment_on_paid",
    idempotencyKey: `fulfilment:${order.id}`,
    payload: {
      orderId: order.id,
      lines: order.lines.map((l) => ({
        orderLineId: l.id,
        variantId: l.variantId,
        sku: l.sku,
        productName: l.productName,
        variantName: l.variantName,
        quantity: l.quantity,
      })),
    },
    maxAttempts: 3,
  });
  void jobRunner.processPending();
}

export const commerce = {
  repo: commerceRepo,
  catalog: new CatalogService(commerceRepo),
  cart: new CartService(commerceRepo, inventoryPort),
  checkout: new CheckoutService(commerceRepo, inventoryPort, handleOrderPaid),
  order: new OrderService(commerceRepo),
  tax: new TaxService(commerceRepo),
  shipping: new ShippingService(commerceRepo),
  promotion: new PromotionService(commerceRepo),
  support: new SupportService(commerceRepo),
  personalization: new PersonalizationService(commerceRepo),
};

const locations = new InventoryLocationService(opsRepo);
const reservations = new ReservationService(opsRepo, ledger);
const lowStock = new LowStockService(opsRepo, ledger);
const variantOps = new VariantOpsService(opsRepo);
const transfers = new TransferService(opsRepo, ledger);
const suppliers = new SupplierService(opsRepo);
const purchaseOrders = new PurchaseOrderService(opsRepo);
const goodsReceipts = new GoodsReceiptService(opsRepo, ledger, purchaseOrders);
const shipments = new ShipmentService(opsRepo);
const returns = new ReturnService(opsRepo, ledger);
const refunds = new RefundService(opsRepo);
const tasks = new TaskService(opsRepo);
const crm = new CrmOpsService();
const workQueue = new WorkQueueService(opsRepo, fulfilment, returns, purchaseOrders, lowStock, shipments);
const pricing = new PricingService(opsRepo);
const expenses = new ExpenseService(opsRepo);
const documents = new DocumentService(opsRepo);
const search = new SearchService(opsRepo, suppliers, purchaseOrders);
const kpi = new KpiService(opsRepo, ledger, lowStock, fulfilment, purchaseOrders, refunds);
const audit = new AuditService(opsRepo);
const barcode = new BarcodeService();

inventoryPort.refreshProjections?.({ organizationId: AMBADY_ORG_ID });

export const operations = {
  repo: opsRepo,
  commerceRepo,
  ledger,
  locations,
  reservations,
  lowStock,
  variantOps,
  transfers,
  suppliers,
  purchaseOrders,
  goodsReceipts,
  fulfilment,
  shipments,
  returns,
  refunds,
  tasks,
  crm,
  workQueue,
  pricing,
  expenses,
  documents,
  search,
  kpi,
  audit,
  barcode,
  eventStore,
  alertEngine,
  jobRunner,
  refreshStockProjections: () => inventoryPort.refreshProjections?.({ organizationId: AMBADY_ORG_ID }),
};

export function opsContext(overrides: Partial<OperationsContext> = {}): OperationsContext {
  return {
    organizationId: AMBADY_ORG_ID,
    userId: "user_owner_001",
    roleKey: "founder",
    requestId: `req_${Date.now()}`,
    ...overrides,
  };
}

export function demoContext(overrides: Partial<CommerceContext> = {}): CommerceContext {
  return {
    organizationId: AMBADY_ORG_ID,
    customerId: DEMO_CUSTOMER_ID,
    userId: "user_demo_001",
    requestId: `req_${Date.now()}`,
    ...overrides,
  };
}

export { createInMemoryOperationsRepository, resetOperationsStore } from "./memory";
export { createAmbadyOperationsSeed, syncCommerceStockFromLedger } from "./seed";
export { createGenericRetailOperationsSeed } from "./generic-retail-seed";
export {
  createSupabaseOperationsRepository,
  loadOperationsStoreFromSupabase,
  resetSupabaseOperationsRepositories,
  type OperationsSupabaseClient,
} from "./supabase";
export {
  createDemoRepositoryBundle,
  createOrgScopedRepositoryBundle,
  createSupabaseRepositoryBundle,
  resolveRepositoryBundle,
  isDemoStoreMode,
  isSupabasePersistenceMode,
  type RepositoryBundle,
} from "./factory";
