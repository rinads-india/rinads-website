import type { NotificationAdapter } from "../adapters/types";
import type { OutboxStore } from "./outbox";

export async function processOutbox(
  store: OutboxStore,
  adapters: Record<string, NotificationAdapter>,
  limit = 50
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const pending = store.messages.filter((m) => m.status === "pending" || m.status === "failed").slice(0, limit);

  for (const msg of pending) {
    msg.status = "processing";
    msg.attempts++;
    msg.updatedAt = new Date().toISOString();
    const adapter = adapters[msg.channel];
    if (!adapter) {
      msg.status = "failed";
      msg.lastError = "No adapter";
      failed++;
      continue;
    }
    const result = await adapter.send({
      recipient: msg.recipient,
      templateKey: msg.templateKey,
      payload: msg.payload,
    });
    if (result.ok) {
      msg.status = "sent";
      sent++;
    } else {
      msg.status = "failed";
      msg.lastError = result.error;
      failed++;
    }
    msg.updatedAt = new Date().toISOString();
  }

  return { sent, failed };
}
