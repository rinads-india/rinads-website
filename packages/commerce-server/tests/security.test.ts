import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CatalogService, OrderService, SupportService } from "@rinads/commerce";
import { createInMemoryRepository, createAmbadySeedStore, AMBADY_ORG_ID, DEMO_CUSTOMER_ID } from "@rinads/commerce-server";

const ctx = { organizationId: AMBADY_ORG_ID };
const otherCustomer = "cust_other";

describe("IDOR guards", () => {
  it("blocks order access for wrong customer", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const orders = new OrderService(repo);
    const store = repo.getStore();
    store.orders.push({
      id: "ord_secret",
      organizationId: AMBADY_ORG_ID,
      customerId: DEMO_CUSTOMER_ID,
      orderNumber: "AMB-9999",
      status: "confirmed",
      paymentStatus: "paid",
      fulfilmentStatus: "unfulfilled",
      subtotal: 100,
      discountTotal: 0,
      shippingTotal: 49,
      taxTotal: 5,
      grandTotal: 154,
      currency: "INR",
      lines: [],
      events: [],
      createdAt: new Date().toISOString(),
    });
    repo.saveStore(store);
    const result = orders.getById(ctx, "ord_secret", otherCustomer);
    assert.ok(!result.ok);
    assert.equal(result.error.code, "FORBIDDEN");
  });

  it("blocks ticket access for wrong customer", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const support = new SupportService(repo);
    const created = support.create(ctx, {
      customerId: DEMO_CUSTOMER_ID,
      subject: "Private",
      body: "Help",
    });
    assert.ok(created.ok);
    const blocked = support.getById(ctx, created.data.id, otherCustomer);
    assert.ok(!blocked.ok);
    assert.equal(blocked.error.code, "FORBIDDEN");
  });
});

describe("Tenant isolation", () => {
  it("lists products only for org context", () => {
    const repo = createInMemoryRepository(createAmbadySeedStore());
    const store = repo.getStore();
    store.products.push({
      id: "prod_other_org",
      organizationId: "org_other",
      name: "Other Org Product",
      slug: "other",
      description: "",
      status: "published",
      categorySlug: "x",
      tags: [],
      ratingAvg: 0,
      ratingCount: 0,
    });
    repo.saveStore(store);
    const catalog = new CatalogService(repo);
    const items = catalog.listPublished({ organizationId: AMBADY_ORG_ID });
    assert.ok(!items.some((p) => p.id === "prod_other_org"));
  });
});
