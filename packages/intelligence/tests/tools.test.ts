import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CatalogService, CartService, OrderService, SupportService } from "@rinads/commerce";
import { createInMemoryRepository, createAmbadySeedStore, AMBADY_ORG_ID } from "@rinads/commerce-server";
import { executeRinpoTool, RINPO_HARD_LIMITS } from "../src/index";

const ctx = { organizationId: AMBADY_ORG_ID, customerId: "cust_demo_001" };
const repo = createInMemoryRepository(createAmbadySeedStore());
const services = {
  catalog: new CatalogService(repo),
  cart: new CartService(repo),
  order: new OrderService(repo),
  support: new SupportService(repo),
};

describe("RINPO tools", () => {
  it("enforces hard limits", () => {
    assert.equal(RINPO_HARD_LIMITS.canSubmitPayment, false);
  });

  it("returns similar products", () => {
    const result = executeRinpoTool(services, ctx, {
      tool: "similar_products",
      args: { productId: "prod_pebbles_001" },
    });
    assert.ok(result.ok);
  });

  it("creates support ticket", () => {
    const result = executeRinpoTool(services, ctx, {
      tool: "create_ticket",
      args: { subject: "Help", body: "Need assistance" },
    });
    assert.ok(result.ok);
  });
});
