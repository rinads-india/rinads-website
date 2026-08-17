export type OutboxMessage = {
  id: string;
  organizationId: string;
  channel: "email" | "whatsapp" | "sms" | "push";
  templateKey: string;
  recipient: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  status: "pending" | "processing" | "sent" | "failed";
  attempts: number;
  lastError?: string;
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type OutboxStore = {
  messages: OutboxMessage[];
  nextId: (prefix: string) => string;
};

export function enqueueNotification(
  store: OutboxStore,
  input: Omit<OutboxMessage, "id" | "status" | "attempts" | "createdAt" | "updatedAt">
): OutboxMessage {
  const existing = store.messages.find(
    (m) => m.organizationId === input.organizationId && m.idempotencyKey === input.idempotencyKey
  );
  if (existing) return existing;

  const msg: OutboxMessage = {
    id: store.nextId("obx"),
    ...input,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.messages.push(msg);
  return msg;
}

export function listOutbox(store: OutboxStore, organizationId: string): OutboxMessage[] {
  return store.messages.filter((m) => m.organizationId === organizationId);
}
