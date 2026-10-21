import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCreditBalance,
  canReserveCredits,
  creditsFromProviderCost,
  normalizeCreditUnits,
  type CreditLedgerEntry,
  type CreditReservation,
} from "../src/credits";

const ledger: CreditLedgerEntry[] = [
  {
    id: "led_1",
    organizationId: "org_1",
    accountId: "acct_1",
    eventType: "grant",
    units: 1_000,
    idempotencyKey: "grant:1",
    occurredAt: "2026-10-21T00:00:00.000Z",
  },
  {
    id: "led_2",
    organizationId: "org_1",
    accountId: "acct_1",
    eventType: "consume",
    units: -250,
    idempotencyKey: "consume:1",
    occurredAt: "2026-10-21T00:05:00.000Z",
  },
  {
    id: "led_other_org",
    organizationId: "org_2",
    accountId: "acct_2",
    eventType: "grant",
    units: 50_000,
    idempotencyKey: "grant:other",
    occurredAt: "2026-10-21T00:00:00.000Z",
  },
];

const reservations: CreditReservation[] = [
  {
    id: "res_active",
    organizationId: "org_1",
    accountId: "acct_1",
    units: 200,
    status: "active",
    idempotencyKey: "reserve:1",
    expiresAt: "2026-10-21T02:00:00.000Z",
    createdAt: "2026-10-21T00:10:00.000Z",
  },
  {
    id: "res_expired",
    organizationId: "org_1",
    accountId: "acct_1",
    units: 100,
    status: "active",
    idempotencyKey: "reserve:expired",
    expiresAt: "2026-10-20T23:59:59.000Z",
    createdAt: "2026-10-20T23:00:00.000Z",
  },
];

describe("AI credits", () => {
  it("calculates tenant-scoped total, reserved, and available balances", () => {
    const balance = calculateCreditBalance(
      ledger,
      reservations,
      "org_1",
      "acct_1",
      new Date("2026-10-21T01:00:00.000Z")
    );

    assert.deepEqual(balance, {
      total: 750,
      reserved: 200,
      available: 550,
    });
  });

  it("fails closed when a reservation exceeds available credits", () => {
    const balance = { total: 500, reserved: 100, available: 400 };
    assert.equal(canReserveCredits(balance, 400), true);
    assert.equal(canReserveCredits(balance, 401), false);
  });

  it("prices provider cost into whole credits with markup", () => {
    assert.equal(creditsFromProviderCost(1_000_000, 2_500, 100_000), 13);
  });

  it("rejects fractional credit units", () => {
    assert.throws(() => normalizeCreditUnits(1.5), /whole integers/);
  });
});
