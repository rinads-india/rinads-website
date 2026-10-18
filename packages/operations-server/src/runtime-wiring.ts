import type { CommerceContext } from "@rinads/commerce";
import type { Order } from "@rinads/commerce";
import {
  createRuntimeService,
  registerAction,
  createReservationExpiryProcessor,
  createLowStockAlertProcessor,
  type RuntimeService,
  type JobProcessor,
  type RuntimePersistenceHooks,
  type MemoryRuntimeStore,
} from "@rinads/runtime";
import type {
  FulfilmentService,
  LowStockService,
  ReservationService,
  TaskService,
  OperationsContext,
} from "@rinads/operations";
import type { OperationsRepository } from "@rinads/operations";
import { AlertEngine } from "@rinads/runtime";

export type RuntimeWiringDeps = {
  opsRepo: OperationsRepository;
  fulfilment: FulfilmentService;
  reservations: ReservationService;
  lowStock: LowStockService;
  tasks: TaskService;
  alertEngine: AlertEngine;
};

export type WireRuntimeOptions = {
  persistenceHooks?: RuntimePersistenceHooks;
  store?: MemoryRuntimeStore;
};

export function wireRuntime(deps: RuntimeWiringDeps, options: WireRuntimeOptions = {}): RuntimeService {
  const runtime = createRuntimeService({
    store: options.store,
    opsRepo: deps.opsRepo,
    persistenceHooks: options.persistenceHooks,
  });

  registerAction({
    key: "fulfilment.create_from_order",
    description: "Create fulfilment from paid order",
    riskLevel: "MEDIUM",
    idempotencyRequired: true,
    moduleKey: "fulfilment",
    handler: async (ctx, input) => {
      const orderId = String(input.orderId ?? "");
      const lines = (input.lines as {
        orderLineId?: string;
        variantId?: string;
        sku: string;
        productName: string;
        variantName: string;
        quantity: number;
      }[]) ?? [];
      const opsCtx: OperationsContext = { organizationId: ctx.organizationId, userId: ctx.userId };
      const result = deps.fulfilment.createForOrder(opsCtx, {
        orderId,
        lines: lines.map((l) => ({
          orderLineId: l.orderLineId ?? l.variantId ?? "",
          variantId: l.variantId ?? "",
          sku: l.sku,
          productName: l.productName,
          variantName: l.variantName,
          quantity: l.quantity,
        })),
      });
      return result.ok ? { ok: true, data: { fulfilmentId: result.data.id } } : { ok: false, error: result.error.message };
    },
    verify: (ctx, input, output) => {
      const fulfilmentId = String(output?.fulfilmentId ?? "");
      const orderId = String(input.orderId ?? "");
      const exists = deps.opsRepo
        .getStore()
        .fulfilments.some(
          (f) =>
            f.id === fulfilmentId &&
            f.organizationId === ctx.organizationId &&
            f.orderId === orderId
        );
      return exists
        ? { ok: true }
        : {
            ok: false,
            error: "Fulfilment postcondition not found after create action",
            errorClass: "verification_error",
          };
    },
  });

  registerAction({
    key: "notification.enqueue",
    description: "Enqueue order notification",
    riskLevel: "LOW",
    idempotencyRequired: true,
    handler: async (ctx, input) => {
      const message = runtime.enqueueNotification({
        organizationId: ctx.organizationId,
        channel: (input.channel as "email" | "whatsapp") ?? "email",
        templateKey: String(input.templateKey ?? "order_confirmation"),
        recipient: String(input.recipient ?? "customer@demo.local"),
        payload: input,
        idempotencyKey: String(input.idempotencyKey ?? `notify:${input.orderId}`),
        correlationId: ctx.correlationId,
      });
      return { ok: true, data: { messageId: message.id } };
    },
    verify: (ctx, input, output) => {
      const messageId = String(output?.messageId ?? "");
      const idempotencyKey = String(input.idempotencyKey ?? `notify:${input.orderId}`);
      const exists = runtime.store.messages.some(
        (m) =>
          m.id === messageId &&
          m.organizationId === ctx.organizationId &&
          m.idempotencyKey === idempotencyKey
      );
      return exists
        ? { ok: true }
        : {
            ok: false,
            error: "Notification outbox postcondition not found after enqueue action",
            errorClass: "verification_error",
          };
    },
  });

  registerAction({
    key: "task.create",
    description: "Create operational task",
    riskLevel: "LOW",
    idempotencyRequired: true,
    handler: async (ctx, input) => {
      const opsCtx: OperationsContext = { organizationId: ctx.organizationId, roleKey: "founder" };
      const task = deps.tasks.create(opsCtx, {
        title: String(input.title ?? "Runtime task"),
        description: String(input.description ?? ""),
        priority: "normal",
        entityType: "order",
        entityId: String(input.orderId ?? ""),
      });
      return { ok: true, data: { taskId: task.id } };
    },
    verify: (ctx, _input, output) => {
      const taskId = String(output?.taskId ?? "");
      const exists = deps.opsRepo
        .getStore()
        .tasks.some((t) => t.id === taskId && t.organizationId === ctx.organizationId);
      return exists
        ? { ok: true }
        : {
            ok: false,
            error: "Task postcondition not found after create action",
            errorClass: "verification_error",
          };
    },
  });

  registerAction({
    key: "analytics.record",
    description: "Record analytics",
    riskLevel: "LOW",
    idempotencyRequired: false,
    handler: async () => ({ ok: true }),
  });

  runtime.registerProcessor(createReservationExpiryProcessor(deps.reservations, deps.alertEngine) as JobProcessor);
  runtime.registerProcessor(createLowStockAlertProcessor(deps.lowStock, deps.alertEngine) as JobProcessor);

  return runtime;
}

export function handleOrderPaidRuntime(
  runtime: RuntimeService,
  ctx: CommerceContext,
  order: Order
): void {
  runtime.handleOrderPaid({
    organizationId: ctx.organizationId,
    orderId: order.id,
    actorId: ctx.userId,
    lines: order.lines.map((l) => ({
      orderLineId: l.id,
      variantId: l.variantId,
      sku: l.sku,
      productName: l.productName,
      variantName: l.variantName,
      quantity: l.quantity,
    })),
  });
}
