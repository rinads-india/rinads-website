import type { OperationsRepository, OperationsStore } from "@rinads/operations";
import { createInMemoryOperationsRepository } from "./memory";

const orgOpsStores = new Map<string, OperationsRepository>();

export type OperationsSupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
    upsert: (rows: Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
  };
};

export type SupabaseOperationsOptions = {
  organizationId: string;
  client?: OperationsSupabaseClient;
  initialStore?: OperationsStore;
};

export function createSupabaseOperationsRepository(
  options: SupabaseOperationsOptions
): OperationsRepository {
  let base = orgOpsStores.get(options.organizationId);
  if (!base) {
    base = createInMemoryOperationsRepository(options.initialStore);
    orgOpsStores.set(options.organizationId, base);
  }

  if (!options.client) return base;

  const client = options.client;
  const orgId = options.organizationId;

  return {
    getStore: () => base!.getStore(),
    saveStore: (store) => {
      base!.saveStore(store);
      void syncOperationsToSupabase(client, orgId, store);
    },
    nextId: (prefix) => base!.nextId(prefix),
    nextDocumentNumber: (oid, docType, prefix) =>
      base!.nextDocumentNumber(oid, docType, prefix),
  };
}

async function syncOperationsToSupabase(
  client: OperationsSupabaseClient,
  orgId: string,
  store: OperationsStore
): Promise<void> {
  const events = store.businessEvents.filter((e) => e.organizationId === orgId);
  if (events.length) {
    await client.from("business_events").upsert(
      events.map((e) => ({
        id: e.id,
        organization_id: orgId,
        event_type: e.eventType,
        entity_type: e.entityType ?? null,
        entity_id: e.entityId ?? null,
        payload: e.payload,
        idempotency_key: e.idempotencyKey ?? null,
        created_at: e.createdAt,
      }))
    );
  }

  const logs = store.auditLogs.filter((a) => a.organizationId === orgId);
  if (logs.length) {
    await client.from("audit_logs").upsert(
      logs.map((a) => ({
        id: a.id,
        organization_id: orgId,
        actor_type: a.actorType,
        actor_id: a.actorId ?? null,
        action: a.action,
        entity: a.entity ?? null,
        entity_id: a.entityId ?? null,
        before: a.before ?? null,
        after: a.after ?? null,
        source: a.source ?? null,
        created_at: a.createdAt,
      }))
    );
  }
}

export function resetSupabaseOperationsRepositories(): void {
  orgOpsStores.clear();
}
