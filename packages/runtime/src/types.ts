export type RuntimeEventType =
  | "order.created"
  | "order.paid"
  | "inventory.reserved"
  | "inventory.low"
  | "inventory.expired"
  | "purchase.created"
  | "purchase.received"
  | "fulfilment.created"
  | "fulfilment.packed"
  | "shipment.created"
  | "shipment.delayed"
  | "return.created"
  | "refund.created";

export type RuntimeJobStatus = "pending" | "processing" | "completed" | "failed" | "dead_letter";

export type RuntimeJob = {
  id: string;
  organizationId: string;
  processorKey: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  status: RuntimeJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type EventProcessor = {
  key: string;
  handle: (ctx: { organizationId: string }, payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
};
