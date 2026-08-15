import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSupabaseOperationsRepository,
  createAmbadyOperationsSeed,
  loadOperationsStoreFromSupabase,
  resetSupabaseOperationsRepositories,
  type OperationsSupabaseClient,
} from "../src/index";

function createMockClient(): OperationsSupabaseClient & { tables: Map<string, Record<string, unknown>[]> } {
  const tables = new Map<string, Record<string, unknown>[]>();

  const client: OperationsSupabaseClient & { tables: Map<string, Record<string, unknown>[]> } = {
    tables,
    from(table: string) {
      if (!tables.has(table)) tables.set(table, []);
      return {
        select: () => ({
          eq: async (col: string, val: string) => {
            const rows = (tables.get(table) ?? []).filter((r) => String(r[col]) === val);
            return { data: rows, error: null };
          },
        }),
        upsert: async (rows: Record<string, unknown>[]) => {
          const existing = tables.get(table) ?? [];
          for (const row of rows) {
            const id = String(row.id ?? `${table}_${existing.length}`);
            const idx = existing.findIndex((r) => String(r.id) === id);
            const stored = { ...row, id };
            if (idx >= 0) existing[idx] = stored;
            else existing.push(stored);
          }
          tables.set(table, existing);
          return { error: null };
        },
      };
    },
  };
  return client;
}

describe("Supabase operations sync", () => {
  it("syncs locations, movements, and audit logs", async () => {
    resetSupabaseOperationsRepositories();
    const orgId = "org_ops_sync";
    const client = createMockClient();
    const seed = createAmbadyOperationsSeed();
    seed.locations.forEach((l) => (l.organizationId = orgId));
    seed.movements.forEach((m) => (m.organizationId = orgId));

    const repo = createSupabaseOperationsRepository({
      organizationId: orgId,
      client,
      initialStore: seed,
    });

    const store = repo.getStore();
    store.auditLogs.push({
      id: "audit_1",
      organizationId: orgId,
      actorType: "system",
      action: "test.action",
      createdAt: new Date().toISOString(),
    });
    repo.saveStore(store);

    await new Promise((r) => setTimeout(r, 10));

    assert.ok((client.tables.get("inventory_locations") ?? []).length >= 1);
    assert.ok((client.tables.get("stock_movements") ?? []).length >= 1);
    assert.equal((client.tables.get("audit_logs") ?? []).length, 1);
  });

  it("syncs inventory reservations", async () => {
    resetSupabaseOperationsRepositories();
    const orgId = "org_res_sync";
    const client = createMockClient();
    const seed = createAmbadyOperationsSeed();
    seed.locations.forEach((l) => (l.organizationId = orgId));
    seed.reservations.push({
      id: "res_1",
      organizationId: orgId,
      variantId: "var_pebbles_500g",
      locationId: seed.locations[0]!.id,
      cartId: "cart_1",
      quantity: 2,
      status: "active",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    const repo = createSupabaseOperationsRepository({
      organizationId: orgId,
      client,
      initialStore: seed,
    });
    repo.saveStore(repo.getStore());
    await new Promise((r) => setTimeout(r, 10));
    assert.equal((client.tables.get("inventory_reservations") ?? []).length, 1);
  });

  it("loads operations store from Supabase", async () => {
    const orgId = "org_ops_load";
    const client = createMockClient();
    client.tables.set("inventory_locations", [
      {
        id: "loc_1",
        organization_id: orgId,
        name: "Main",
        code: "MAIN",
        is_default: true,
        is_sellable: true,
        status: "active",
        created_at: new Date().toISOString(),
      },
    ]);

    const loaded = await loadOperationsStoreFromSupabase(client, orgId);
    assert.ok(loaded);
    assert.equal(loaded!.locations.length, 1);
  });
});
