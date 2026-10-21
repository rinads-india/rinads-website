import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COS_ENTITIES, createCosRowDb } from "../src";
import type { Filter, Row, RowDb, SelectOptions } from "../src";

/** Records exactly what the adapter sends to the (RLS-bound) database. */
function recorder(rows: Row[] = []) {
  const calls: { op: string; table: string; payload: unknown; where?: Filter; options?: SelectOptions }[] = [];
  const db: RowDb = {
    async select(table, options) {
      calls.push({ op: "select", table, payload: undefined, options, where: options?.where });
      return { data: rows, error: null };
    },
    async insert(table, r) {
      calls.push({ op: "insert", table, payload: r });
      return { data: Array.isArray(r) ? r : [r], error: null };
    },
    async update(table, patch, where) {
      calls.push({ op: "update", table, payload: patch, where });
      return { data: [{ ...patch }], error: null };
    },
  };
  return { db: createCosRowDb(db), calls };
}

describe("Business Graph adapter", () => {
  it("passes tables it does not know straight through (rinpo_actions, studio, growth, …)", async () => {
    const { db, calls } = recorder();
    await db.select("rinpo_actions", { where: { status: "pending" } });
    await db.insert("studio_jobs", { title: "x" });
    assert.deepEqual(calls.map((c) => c.table), ["rinpo_actions", "studio_jobs"]);
    assert.deepEqual(calls[0].where, { status: "pending" });
  });

  it("maps logical tables and columns to cos_* on writes (people are worker ids, totals are amounts)", async () => {
    const { db, calls } = recorder();
    await db.insert("finance_invoices", { organization_id: "o", number: "INV-1", total: 100, issue_date: "2026-10-01", due_date: "2026-10-31", status: "issued" });
    await db.insert("operational_tasks", { organization_id: "o", title: "t", assignee_id: "w1", status: "completed", priority: "urgent" });
    await db.insert("people_profiles", { organization_id: "o", display_name: "Mia", skills: { design: 5 }, weekly_capacity_hours: 30, status: "on_leave" });
    assert.deepEqual(calls[0], { op: "insert", table: "cos_invoices", payload: [{ organization_id: "o", number: "INV-1", amount: 100, issued_at: "2026-10-01", due_at: "2026-10-31", status: "sent" }] });
    assert.deepEqual(calls[1].payload, [{ organization_id: "o", title: "t", assignee_worker_id: "w1", status: "done", priority: "critical" }]);
    assert.deepEqual(calls[2].payload, [{ organization_id: "o", display_name: "Mia", skill_levels: { design: 5 }, available_hours_week: 30, profile_status: "on_leave" }]);
  });

  it("reads stored values back into the engine's vocabulary", async () => {
    const { db } = recorder([
      { id: "1", amount: 50, status: "partial", issued_at: "2026-10-01", due_at: "2026-10-31", extra_physical_only: "ignored" },
      { id: "2", amount: 70, status: "overdue" },
    ]);
    const res = await db.select("finance_invoices");
    assert.deepEqual(res.data.map((r) => [r.total, r.status]), [[50, "partially_paid"], [70, "issued"]]);
    assert.ok(!("extra_physical_only" in res.data[0]), "unmapped physical columns are not leaked into the logical row");
    const tasks = await recorder([{ id: "t", status: "review", priority: "critical", assignee_worker_id: "w" }]).db.select("operational_tasks");
    assert.deepEqual(tasks.data[0], { id: "t", status: "in_progress", priority: "urgent", assignee_id: "w" });
    const co = await recorder([{ id: "c", lifecycle_stage: "qualified" }, { id: "d", lifecycle_stage: "client" }]).db.select("crm_companies");
    assert.deepEqual(co.data.map((r) => r.relationship), ["prospect", "client"]);
  });

  it("a filter on a collapsed status includes every stored value that reads back as it", async () => {
    const { db, calls } = recorder();
    await db.select("finance_invoices", { where: { status: { in: ["draft", "issued", "partially_paid"] } } });
    assert.deepEqual(calls[0].where, { status: { in: ["draft", "sent", "overdue", "partial"] } });
    await db.select("operational_tasks", { where: { status: { in: ["todo", "in_progress", "blocked"] } } });
    assert.deepEqual(calls[1].where, { status: { in: ["todo", "in_progress", "review", "waiting"] } });
    await db.select("crm_opportunities", { where: { stage: "negotiation" } });
    assert.deepEqual(calls[2].where, { stage: { in: ["negotiation", "contract"] } });
    await db.select("project_milestones", { where: { status: "pending" } });
    assert.deepEqual(calls[3].where, { status: { in: ["planned", "missed"] } });
  });

  it("translates column lists, ordering and updates; keeps tenant filters intact", async () => {
    const { db, calls } = recorder();
    await db.select("finance_payments", { columns: "id,received_at,amount", where: { organization_id: "o", invoice_id: "i" }, order: [{ column: "received_at", ascending: false }] });
    assert.equal(calls[0].options?.columns, "id,paid_at,amount");
    assert.deepEqual(calls[0].where, { organization_id: "o", invoice_id: "i" });
    assert.deepEqual(calls[0].options?.order, [{ column: "paid_at", ascending: false }]);
    await db.update("crm_contracts", { status: "signed", contract_value: 9 }, { id: "c", organization_id: "o" });
    assert.deepEqual(calls[1].payload, { status: "signed", value: 9 });
    assert.deepEqual(calls[1].where, { id: "c", organization_id: "o" });
  });

  it("an unknown logical column is a programming error and throws before touching the database", async () => {
    const { db, calls } = recorder();
    await assert.rejects(() => db.insert("crm_leads", { organization_id: "o", nope: 1 }), /not a known column/);
    await assert.rejects(() => db.select("crm_leads", { columns: "id,nope" }), /not a known column/);
    await assert.rejects(() => db.update("crm_leads", { status: "new" }, { nope: 1 }), /not a known column/);
    assert.equal(calls.length, 0);
  });

  it("every logical column resolves to a distinct physical column", () => {
    for (const [name, entity] of Object.entries(COS_ENTITIES)) {
      const physical = Object.values(entity.columns).map((c) => (typeof c === "string" ? c : c.col));
      assert.equal(new Set(physical).size, physical.length, `${name} maps two logical columns onto one physical column`);
      assert.match(entity.table, /^cos_/);
    }
  });
});
