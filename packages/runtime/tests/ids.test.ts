import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMemoryRuntimeStore, enqueueJob } from "../src/index";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Runtime identifiers", () => {
  it("generates UUID identities compatible with Supabase UUID columns", () => {
    const store = createMemoryRuntimeStore();
    const ids = [
      store.nextId("evt"),
      store.nextId("job"),
      store.nextId("dlq"),
      store.nextId("wfx"),
      store.nextId("apr"),
    ];

    for (const id of ids) assert.match(id, UUID_RE);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("creates durable jobs with UUID primary keys", () => {
    const store = createMemoryRuntimeStore();
    const job = enqueueJob(store, {
      organizationId: "org_a",
      processorKey: "test",
      idempotencyKey: "test:1",
      payload: {},
      maxAttempts: 3,
    });

    assert.match(job.id, UUID_RE);
  });
});
