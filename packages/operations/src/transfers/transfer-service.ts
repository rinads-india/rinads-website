import type { OperationsRepository } from "../repository";
import { err, ok } from "../result";
import type { OperationsContext, Result, StockTransfer, StockTransferLine, TransferStatus } from "../types";
import { StockLedgerService } from "../inventory/inventory-service";

const TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  draft: ["requested", "cancelled"],
  requested: ["approved", "cancelled"],
  approved: ["dispatched", "cancelled"],
  dispatched: ["in_transit"],
  in_transit: ["received"],
  received: [],
  cancelled: [],
};

export class TransferService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly ledger: StockLedgerService
  ) {}

  create(
    ctx: OperationsContext,
    input: {
      fromLocationId: string;
      toLocationId: string;
      lines: { variantId: string; quantity: number }[];
      notes?: string;
    }
  ): Result<StockTransfer> {
    if (input.fromLocationId === input.toLocationId) {
      return err("INVALID_TRANSFER", "Source and destination must differ.");
    }
    const store = this.repo.getStore();
    const transfer: StockTransfer = {
      id: this.repo.nextId("xfr"),
      organizationId: ctx.organizationId,
      transferNumber: this.repo.nextDocumentNumber(ctx.organizationId, "transfer", "XFR"),
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      status: "draft",
      requestedBy: ctx.userId,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.transfers.push(transfer);
    for (const line of input.lines) {
      store.transferLines.push({
        id: this.repo.nextId("xfl"),
        transferId: transfer.id,
        variantId: line.variantId,
        quantity: line.quantity,
        quantityDispatched: 0,
        quantityReceived: 0,
      });
    }
    this.repo.saveStore(store);
    return ok(transfer);
  }

  transition(ctx: OperationsContext, transferId: string, status: TransferStatus): Result<StockTransfer> {
    const store = this.repo.getStore();
    const transfer = store.transfers.find(
      (t) => t.id === transferId && t.organizationId === ctx.organizationId
    );
    if (!transfer) return err("TRANSFER_NOT_FOUND", "Transfer not found.");
    if (!TRANSITIONS[transfer.status].includes(status)) {
      return err("INVALID_STATUS", `Cannot transition from ${transfer.status} to ${status}.`);
    }

    const lines = store.transferLines.filter((l) => l.transferId === transferId);

    if (status === "dispatched") {
      for (const line of lines) {
        const mov = this.ledger.recordMovement(ctx, {
          variantId: line.variantId,
          locationId: transfer.fromLocationId,
          quantityDelta: -line.quantity,
          movementType: "transfer_out",
          referenceType: "transfer",
          referenceId: transferId,
        });
        if (!mov.ok) return mov;
        line.quantityDispatched = line.quantity;
      }
    }

    if (status === "received") {
      for (const line of lines) {
        const mov = this.ledger.recordMovement(ctx, {
          variantId: line.variantId,
          locationId: transfer.toLocationId,
          quantityDelta: line.quantity,
          movementType: "transfer_in",
          referenceType: "transfer",
          referenceId: transferId,
        });
        if (!mov.ok) return mov;
        line.quantityReceived = line.quantity;
      }
    }

    transfer.status = status;
    transfer.updatedAt = new Date().toISOString();
    if (status === "approved") transfer.approvedBy = ctx.userId;
    this.repo.saveStore(store);
    return ok(transfer);
  }

  list(ctx: OperationsContext): StockTransfer[] {
    return this.repo
      .getStore()
      .transfers.filter((t) => t.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getLines(transferId: string): StockTransferLine[] {
    return this.repo.getStore().transferLines.filter((l) => l.transferId === transferId);
  }
}
