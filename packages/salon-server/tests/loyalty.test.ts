import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SalonLoyaltyRepository } from "../src/loyalty-repository";
import { createSalonMockClient } from "./mock-client";

describe("SalonLoyaltyRepository", () => {
  it("tenant-scopes account and ledger reads", async () => {
    const client = createSalonMockClient();
    client.tables.set("salon_loyalty_accounts", [
      { id: "a1", organization_id: "org1", program_id: "p1", customer_id: "c1", lifetime_earned_points: 100 },
      { id: "a2", organization_id: "org2", program_id: "p2", customer_id: "c1", lifetime_earned_points: 999 },
    ]);
    client.tables.set("salon_loyalty_ledger_entries", [
      { id: "l1", organization_id: "org1", account_id: "a1", entry_type: "earn", points: 10, idempotency_key: "one" },
      { id: "l2", organization_id: "org2", account_id: "a1", entry_type: "earn", points: 999, idempotency_key: "other-tenant" },
    ]);
    const repo = new SalonLoyaltyRepository(client);
    const account = await repo.getAccount("org1", "c1");
    const ledger = await repo.listLedger("org1", "a1");
    assert.ok(account.ok);
    assert.equal(account.ok && account.data.id, "a1");
    assert.ok(ledger.ok);
    assert.deepEqual(ledger.ok && ledger.data.map((entry) => entry.id), ["l1"]);
  });

  it("passes tenant and idempotency keys to atomic RPCs", async () => {
    const calls: Array<{ fn: string; args?: Record<string, unknown> }> = [];
    const base = createSalonMockClient();
    base.rpc = async (fn, args) => {
      calls.push({ fn, args });
      return { data: { id: "r1", organization_id: "org1", account_id: "a1", points: 20, currency_value: 2, status: "processed", idempotency_key: "idem" }, error: null };
    };
    const result = await new SalonLoyaltyRepository(base).redeem("org1", "c1", 20, "s1", "idem");
    assert.ok(result.ok);
    assert.equal(calls[0].fn, "salon_loyalty_redeem");
    assert.equal(calls[0].args?.p_organization_id, "org1");
    assert.equal(calls[0].args?.p_idempotency_key, "idem");
  });
});
