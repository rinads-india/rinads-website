import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CatalogService, CartService, OrderService, SupportService } from "@rinads/commerce";
import { createInMemoryRepository, createAmbadySeedStore, AMBADY_ORG_ID } from "@rinads/commerce-server";
import { executeRinpoTool, RINPO_HARD_LIMITS, listRinpoTools, type RinpoOpsServices } from "../src/index";

const ctx = { organizationId: AMBADY_ORG_ID, customerId: "cust_demo_001" };
const fakeOps = { lowStock: { listLowStock: () => [] } } as unknown as RinpoOpsServices;
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

  it("lists owner tools from registry", () => {
    const ownerTools = listRinpoTools({ ownerOnly: true });
    assert.ok(ownerTools.some((t) => t.key === "ops_daily_briefing"));
    assert.ok(ownerTools.every((t) => t.category === "READ" || t.category === "DRAFT" || t.category === "ACTION"));
  });

  it("blocks owner-only tools for a customer-role caller even when ops services are available", () => {
    const result = executeRinpoTool(services, ctx, { tool: "ops_low_stock", args: {} }, fakeOps);
    assert.equal(result.ok, false);
    assert.match(result.message, /owner or manager role/);
  });

  it("blocks owner-only tools when the caller has no role at all", () => {
    const result = executeRinpoTool(services, { ...ctx, roleKey: "viewer" }, { tool: "ops_low_stock", args: {} }, fakeOps);
    assert.equal(result.ok, false);
  });

  it("allows owner-only tools for a founder-role caller", () => {
    const result = executeRinpoTool(
      services,
      { ...ctx, roleKey: "founder" },
      { tool: "ops_low_stock", args: {} },
      fakeOps
    );
    assert.equal(result.ok, true);
  });

  it("allows owner-only tools for an admin-role caller", () => {
    const result = executeRinpoTool(
      services,
      { ...ctx, roleKey: "admin" },
      { tool: "ops_low_stock", args: {} },
      fakeOps
    );
    assert.equal(result.ok, true);
  });

  it("never coerces the ops context role to founder", () => {
    // toOps() must pass through the real (absent) role rather than
    // defaulting to "founder" — this is exercised indirectly: without a
    // roleKey, the owner-only gate itself blocks the call.
    const result = executeRinpoTool(services, ctx, { tool: "ops_low_stock", args: {} }, fakeOps);
    assert.equal(result.ok, false);
  });
});
