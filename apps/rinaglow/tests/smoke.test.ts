import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_WEEKLY_HOURS, generateDaySlots, canTransitionAppointmentStatus } from "@rinads/salon";
import { SalonRepository, type SalonRow, type SalonSupabaseClient } from "@rinads/salon-server";

function createMockClient(): SalonSupabaseClient & { tables: Map<string, SalonRow[]> } {
  const tables = new Map<string, SalonRow[]>();
  let seq = 0;
  return {
    tables,
    from(table: string) {
      if (!tables.has(table)) tables.set(table, []);
      return {
        select: () => ({
          eq: async (col: string, val: string | boolean) => ({
            data: (tables.get(table) ?? []).filter((r) => r[col] === val),
            error: null,
          }),
        }),
        insert: (row: SalonRow) => ({
          select: () => ({
            single: async () => {
              const id = String(row.id ?? `${table}_${++seq}`);
              const stored = { id, ...row };
              tables.set(table, [...(tables.get(table) ?? []), stored]);
              return { data: stored, error: null };
            },
          }),
        }),
        update: (patch: SalonRow) => ({
          eq: async (col: string, val: string | boolean) => {
            const existing = tables.get(table) ?? [];
            const idx = existing.findIndex((r) => r[col] === val);
            if (idx === -1) return { error: { message: "Not found" } };
            existing[idx] = { ...existing[idx], ...patch };
            return { error: null };
          },
        }),
      };
    },
    rpc: async () => ({ data: null, error: { message: "not used in this smoke test" } }),
  } as unknown as SalonSupabaseClient & { tables: Map<string, SalonRow[]> };
}

describe("apps/rinaglow salon integration smoke test", () => {
  it("wires @rinads/salon domain logic and @rinads/salon-server repository together", async () => {
    const repo = new SalonRepository(createMockClient());
    const branch = await repo.createBranch("org_smoke", { name: "Smoke Branch" });
    assert.ok(branch.ok);

    const monday = new Date("2026-09-07T00:00:00.000Z");
    const slots = generateDaySlots({ dayStartUtc: monday, workingHours: DEFAULT_WEEKLY_HOURS, serviceDurationMin: 30 });
    assert.ok(slots.length > 0);

    assert.ok(canTransitionAppointmentStatus("pending", "confirmed"));
    assert.ok(!canTransitionAppointmentStatus("completed", "pending"));
  });
});
