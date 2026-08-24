import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_STATUS_PROGRESS } from "@/lib/services/types";

describe("services catalog", () => {
  it("maps order statuses to progress percentages", () => {
    assert.equal(ORDER_STATUS_PROGRESS.delivered, 100);
    assert.equal(ORDER_STATUS_PROGRESS.assigned, 25);
    assert.equal(ORDER_STATUS_PROGRESS.pending, 5);
  });
});
