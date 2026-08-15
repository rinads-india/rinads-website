import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkEventLoop } from "../src/loop-guard";
import { createMemoryRuntimeStore } from "../src/store/memory-store";
import { emitEvent } from "../src/events/emit";

describe("Loop guard", () => {
  it("blocks duplicate event bursts for same aggregate", () => {
    const store = createMemoryRuntimeStore();
    const input = {
      organizationId: "org_a",
      eventType: "inventory.low_stock.v1",
      aggregateId: "var_1",
    };
    const first = checkEventLoop(store, input);
    assert.equal(first.allowed, true);
    emitEvent(store, {
      organizationId: input.organizationId,
      eventType: input.eventType,
      aggregateType: "variant",
      aggregateId: input.aggregateId,
      payload: {},
    });
    const second = checkEventLoop(store, input);
    assert.equal(second.allowed, false);
  });
});
