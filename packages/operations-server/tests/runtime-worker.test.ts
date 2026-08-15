import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runSupabaseRuntimeWorker } from "../src/runtime-worker";

function createWorkerMockClient() {
  const tables = new Map<string, Record<string, unknown>[]>();
  tables.set("inventory_locations", [
    {
      id: "loc_1",
      organization_id: "org_worker",
      name: "Main",
      code: "MAIN",
      is_default: true,
      is_sellable: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
  ]);

  return {
    tables,
    from(table: string) {
      if (!tables.has(table)) tables.set(table, []);
      return {
        select: () => ({
          eq: async (_col: string, val: string) => ({
            data: (tables.get(table) ?? []).filter((r) => String(r.organization_id) === val),
            error: null,
          }),
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
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "reset_stale_runtime_jobs") return { data: 0, error: null };
      if (fn === "claim_runtime_jobs") return { data: [], error: null };
      return { data: null, error: null };
    },
  };
}

describe("runSupabaseRuntimeWorker", () => {
  it("runs worker cycle with supabase client mock", async () => {
    const client = createWorkerMockClient();
    const result = await runSupabaseRuntimeWorker(client as never, "org_worker");
    assert.equal(result.claimed, 0);
    assert.ok(result.processed >= 0);
  });
});
