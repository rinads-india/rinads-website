import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeExpirablePoints, planLoyaltyExpiryBatch } from "../src/loyalty";

describe("loyalty expiry FIFO", () => {
  it("expires remaining points from lots older than the window", () => {
    const asOf = new Date("2026-09-21T12:00:00.000Z");
    const points = computeExpirablePoints(
      [
        { id: "e1", points: 100, createdAt: "2026-01-01T00:00:00.000Z" },
        { id: "r1", points: -40, createdAt: "2026-02-01T00:00:00.000Z" },
        { id: "e2", points: 20, createdAt: "2026-09-01T00:00:00.000Z" },
      ],
      90,
      asOf
    );
    // Oldest lot had 60 remaining after redemption and is past 90 days; recent earn stays.
    assert.equal(points, 60);
  });

  it("returns zero when expiry is disabled or nothing aged out", () => {
    assert.equal(computeExpirablePoints([{ id: "e1", points: 10, createdAt: "2026-09-20T00:00:00.000Z" }], 0), 0);
    assert.equal(
      computeExpirablePoints(
        [{ id: "e1", points: 10, createdAt: "2026-09-20T00:00:00.000Z" }],
        30,
        new Date("2026-09-21T00:00:00.000Z")
      ),
      0
    );
  });

  it("plans per-account batches", () => {
    const asOf = new Date("2026-09-21T00:00:00.000Z");
    const planned = planLoyaltyExpiryBatch(
      [
        {
          accountId: "a1",
          customerId: "c1",
          entries: [{ id: "e1", points: 15, createdAt: "2025-01-01T00:00:00.000Z" }],
        },
        {
          accountId: "a2",
          customerId: "c2",
          entries: [{ id: "e2", points: 5, createdAt: "2026-09-20T00:00:00.000Z" }],
        },
      ],
      30,
      asOf
    );
    assert.deepEqual(planned, [{ accountId: "a1", customerId: "c1", points: 15 }]);
  });
});
