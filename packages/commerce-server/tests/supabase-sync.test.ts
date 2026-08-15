import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSupabaseCommerceRepository,
  createAmbadySeedStore,
  loadCommerceStoreFromSupabase,
  type CommerceSupabaseClient,
} from "../src/index";

function createMockClient(): CommerceSupabaseClient & { tables: Map<string, Record<string, unknown>[]> } {
  const tables = new Map<string, Record<string, unknown>[]>();

  const client: CommerceSupabaseClient & { tables: Map<string, Record<string, unknown>[]> } = {
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

describe("Supabase commerce sync", () => {
  it("syncs products, variants, shipping, and orders on saveStore", async () => {
    const orgId = "org_sync_test";
    const client = createMockClient();
    const seed = createAmbadySeedStore();
    seed.products.forEach((p) => (p.organizationId = orgId));
    seed.variants.forEach((v) => (v.organizationId = orgId));
    seed.shippingMethods.forEach((s) => (s.organizationId = orgId));

    const repo = createSupabaseCommerceRepository({
      organizationId: orgId,
      client,
      initialStore: seed,
    });

    const store = repo.getStore();
    store.orders.push({
      id: "ord_test_1",
      organizationId: orgId,
      orderNumber: "ORD-001",
      status: "placed",
      paymentStatus: "paid",
      fulfilmentStatus: "unfulfilled",
      subtotal: 279,
      discountTotal: 0,
      shippingTotal: 49,
      taxTotal: 14,
      grandTotal: 342,
      currency: "INR",
      shippingMethodCode: "standard",
      lines: [
        {
          id: "ol_1",
          variantId: "var_pebbles_1kg",
          productName: "Ambady Premium Pebbles",
          variantName: "1 kg",
          sku: "PEB-1KG",
          quantity: 1,
          unitPrice: 279,
          taxAmount: 14,
          discountAmount: 0,
        },
      ],
      events: [{ id: "oe_1", eventType: "placed", label: "Order placed", occurredAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    });
    repo.saveStore(store);

    await new Promise((r) => setTimeout(r, 10));

    assert.ok((client.tables.get("products") ?? []).length >= 2);
    assert.ok((client.tables.get("product_variants") ?? []).length >= 2);
    assert.ok((client.tables.get("shipping_methods") ?? []).length >= 1);
    assert.equal((client.tables.get("orders") ?? []).length, 1);
    assert.equal((client.tables.get("order_lines") ?? []).length, 1);
  });

  it("loads commerce store from Supabase tables", async () => {
    const orgId = "org_load_test";
    const client = createMockClient();
    client.tables.set("products", [
      {
        id: "prod_1",
        organization_id: orgId,
        name: "Test",
        slug: "test",
        description: "desc",
        status: "published",
        category_slug: "general",
        tags: [],
        rating_avg: 0,
        rating_count: 0,
      },
    ]);
    client.tables.set("product_variants", [
      {
        id: "var_1",
        organization_id: orgId,
        product_id: "prod_1",
        name: "Default",
        sku: "SKU-1",
        price: 100,
        stock: 10,
        status: "active",
      },
    ]);

    const loaded = await loadCommerceStoreFromSupabase(client, orgId);
    assert.ok(loaded);
    assert.equal(loaded!.products.length, 1);
    assert.equal(loaded!.variants.length, 1);
  });
});
