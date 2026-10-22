import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createRazorpayCustomer,
  createRazorpaySubscription,
} from "../src/providers/razorpay";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const config = {
  keyId: "rzp_test_123456789",
  keySecret: "secret_123",
};

describe("Razorpay HTTP API contracts", () => {
  it("creates a real Razorpay customer request and never fabricates an id", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(
        JSON.stringify({
          id: "cust_real_123",
          entity: "customer",
          name: "R GLOW Salon",
          email: "owner@example.com",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const result = await createRazorpayCustomer({
      config,
      email: "owner@example.com",
      organizationId: "org_123",
      name: "R GLOW Salon",
    });

    assert.ok(!("error" in result));
    if ("error" in result) return;
    assert.equal(result.id, "cust_real_123");
    assert.equal(requestUrl, "https://api.razorpay.com/v1/customers");
    assert.equal(requestInit?.method, "POST");

    const body = JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
    assert.equal(body.email, "owner@example.com");
    assert.equal(body.name, "R GLOW Salon");
    assert.equal(body.fail_existing, "0");
    assert.deepEqual(body.notes, { organization_id: "org_123" });
  });

  it("creates a subscription using Razorpay plan/count fields and returns authorization URL", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(
        JSON.stringify({
          id: "sub_real_123",
          entity: "subscription",
          plan_id: "plan_growth_monthly",
          status: "created",
          total_count: 12,
          paid_count: 0,
          remaining_count: 12,
          short_url: "https://rzp.io/rzp/real123",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const result = await createRazorpaySubscription({
      config,
      planId: "plan_growth_monthly",
      totalCount: 12,
      customerNotify: false,
      notes: {
        organization_id: "org_123",
        product: "r-glow",
      },
    });

    assert.ok(!("error" in result));
    if ("error" in result) return;
    assert.equal(result.id, "sub_real_123");
    assert.equal(result.shortUrl, "https://rzp.io/rzp/real123");
    assert.equal(requestUrl, "https://api.razorpay.com/v1/subscriptions");

    const body = JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
    assert.equal(body.plan_id, "plan_growth_monthly");
    assert.equal(body.total_count, 12);
    assert.equal(body.quantity, 1);
    assert.equal(body.customer_notify, false);
    assert.deepEqual(body.notes, {
      organization_id: "org_123",
      product: "r-glow",
    });
    assert.ok(!("customer_id" in body));
  });

  it("fails closed on invalid subscription input without making a network request", async () => {
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("should not be called");
    }) as typeof fetch;

    const result = await createRazorpaySubscription({
      config,
      planId: "not-a-plan",
      totalCount: 0,
    });

    assert.deepEqual(result, { error: "Invalid Razorpay plan id" });
    assert.equal(called, false);
  });

  it("propagates Razorpay API error descriptions instead of inventing success", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ error: { description: "The plan id provided does not exist" } }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    const result = await createRazorpaySubscription({
      config,
      planId: "plan_missing",
      totalCount: 12,
    });

    assert.deepEqual(result, { error: "The plan id provided does not exist" });
  });
});
