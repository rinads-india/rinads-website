import type { OperationsRepository } from "../repository";
import { err, ok, roundMoney } from "../result";
import type {
  OperationsContext,
  Refund,
  ReturnInventoryDisposition,
  ReturnLine,
  ReturnReason,
  ReturnRequest,
  ReturnRequestStatus,
  Result,
} from "../types";
import { StockLedgerService } from "../inventory/inventory-service";

export class ReturnService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly ledger: StockLedgerService
  ) {}

  create(
    ctx: OperationsContext,
    input: {
      orderId: string;
      customerId?: string;
      reason: ReturnReason;
      lines: { orderLineId?: string; variantId: string; quantity: number; reason?: ReturnReason }[];
      notes?: string;
    }
  ): Result<ReturnRequest> {
    const store = this.repo.getStore();
    const rr: ReturnRequest = {
      id: this.repo.nextId("ret"),
      organizationId: ctx.organizationId,
      orderId: input.orderId,
      customerId: input.customerId,
      status: "requested",
      reason: input.reason,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.returnRequests.push(rr);
    for (const line of input.lines) {
      store.returnLines.push({
        id: this.repo.nextId("rtl"),
        returnRequestId: rr.id,
        orderLineId: line.orderLineId,
        variantId: line.variantId,
        quantity: line.quantity,
        reason: line.reason ?? input.reason,
      });
    }
    this.repo.saveStore(store);
    return ok(rr);
  }

  transition(ctx: OperationsContext, returnId: string, status: ReturnRequestStatus): Result<ReturnRequest> {
    const store = this.repo.getStore();
    const rr = store.returnRequests.find(
      (r) => r.id === returnId && r.organizationId === ctx.organizationId
    );
    if (!rr) return err("RETURN_NOT_FOUND", "Return request not found.");
    rr.status = status;
    rr.updatedAt = new Date().toISOString();
    this.repo.saveStore(store);
    return ok(rr);
  }

  inspectLine(
    ctx: OperationsContext,
    lineId: string,
    input: {
      disposition: ReturnInventoryDisposition;
      inspectionNotes?: string;
      resolution?: string;
      locationId: string;
    }
  ): Result<ReturnLine> {
    const store = this.repo.getStore();
    const line = store.returnLines.find((l) => l.id === lineId);
    if (!line) return err("RETURN_LINE_NOT_FOUND", "Return line not found.");

    line.disposition = input.disposition;
    line.inspectionNotes = input.inspectionNotes;
    line.resolution = input.resolution;

    if (input.disposition === "sellable") {
      this.ledger.recordMovement(ctx, {
        variantId: line.variantId,
        locationId: input.locationId,
        quantityDelta: line.quantity,
        movementType: "return",
        referenceType: "return_line",
        referenceId: line.id,
        reason: "Return to sellable stock",
      });
    } else if (input.disposition === "damaged") {
      this.ledger.recordMovement(ctx, {
        variantId: line.variantId,
        locationId: input.locationId,
        quantityDelta: line.quantity,
        movementType: "return",
        referenceType: "return_line",
        referenceId: line.id,
      });
      this.ledger.recordMovement(ctx, {
        variantId: line.variantId,
        locationId: input.locationId,
        quantityDelta: -line.quantity,
        movementType: "damage",
        referenceType: "return_line",
        referenceId: line.id,
        reason: "Damaged return",
      });
    }

    this.repo.saveStore(store);
    return ok(line);
  }

  list(ctx: OperationsContext, status?: ReturnRequestStatus): ReturnRequest[] {
    return this.repo
      .getStore()
      .returnRequests.filter(
        (r) => r.organizationId === ctx.organizationId && (!status || r.status === status)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getLines(returnRequestId: string): ReturnLine[] {
    return this.repo.getStore().returnLines.filter((l) => l.returnRequestId === returnRequestId);
  }

  pendingReview(ctx: OperationsContext): ReturnRequest[] {
    return this.list(ctx).filter((r) =>
      ["requested", "received", "inspected"].includes(r.status)
    );
  }
}

export class RefundService {
  constructor(private readonly repo: OperationsRepository) {}

  create(
    ctx: OperationsContext,
    input: {
      orderId: string;
      returnRequestId?: string;
      amount: number;
      reason?: string;
      currency?: string;
    }
  ): Result<Refund> {
    if (input.amount <= 0) return err("INVALID_AMOUNT", "Refund amount must be positive.");
    const store = this.repo.getStore();
    const refund: Refund = {
      id: this.repo.nextId("rfnd"),
      organizationId: ctx.organizationId,
      orderId: input.orderId,
      returnRequestId: input.returnRequestId,
      amount: roundMoney(input.amount),
      currency: input.currency ?? "INR",
      status: "pending",
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };
    store.refunds.push(refund);
    this.repo.saveStore(store);
    return ok(refund);
  }

  approve(ctx: OperationsContext, refundId: string): Result<Refund> {
    const store = this.repo.getStore();
    const refund = store.refunds.find(
      (r) => r.id === refundId && r.organizationId === ctx.organizationId
    );
    if (!refund) return err("REFUND_NOT_FOUND", "Refund not found.");
    refund.status = "approved";
    refund.processedBy = ctx.userId;
    this.repo.saveStore(store);
    return ok(refund);
  }

  process(ctx: OperationsContext, refundId: string, paymentReference?: string): Result<Refund> {
    const store = this.repo.getStore();
    const refund = store.refunds.find(
      (r) => r.id === refundId && r.organizationId === ctx.organizationId
    );
    if (!refund) return err("REFUND_NOT_FOUND", "Refund not found.");
    if (refund.status !== "approved") {
      return err("REFUND_NOT_APPROVED", "Refund must be approved before processing.");
    }
    refund.status = "processed";
    refund.paymentReference = paymentReference;
    refund.processedBy = ctx.userId;
    this.repo.saveStore(store);
    return ok(refund);
  }

  list(ctx: OperationsContext): Refund[] {
    return this.repo
      .getStore()
      .refunds.filter((r) => r.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  totalRefunded(ctx: OperationsContext): number {
    return this.list(ctx)
      .filter((r) => r.status === "processed")
      .reduce((sum, r) => sum + r.amount, 0);
  }
}
