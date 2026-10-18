import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryRuntimeStore,
  createRuntimeService,
  enqueueJob,
  processJobQueue,
  replayDeadLetter,
  type JobProcessor,
} from "../src/index";

describe("Runtime dead-letter replay", () => {
  it("creates a DLQ record for missing processors instead of only changing job status", async () => {
    const store = createMemoryRuntimeStore();
    const job = enqueueJob(store, {
      organizationId: "org_a",
      processorKey: "missing_processor",
      idempotencyKey: "job:missing:1",
      payload: { orderId: "o1" },
      maxAttempts: 3,
      runAfter: "2020-01-01T00:00:00.000Z",
    });

    const result = await processJobQueue(store, new Map(), new Date("2026-10-11T00:00:00.000Z"));

    assert.equal(result.deadLetter, 1);
    assert.equal(job.status, "dead_letter");
    assert.equal(store.deadLetters.length, 1);
    assert.equal(store.deadLetters[0]?.sourceId, job.id);
    assert.equal(store.deadLetters[0]?.errorClass, "processor_not_found");
    assert.equal(store.deadLetters[0]?.status, "open");
  });

  it("replays the original job without cloning its idempotency identity", async () => {
    const store = createMemoryRuntimeStore();
    const failingProcessor: JobProcessor = {
      key: "terminal",
      handle: async () => ({ ok: false, error: "bad payload", retryable: false }),
    };
    const processors = new Map<string, JobProcessor>([[failingProcessor.key, failingProcessor]]);
    const job = enqueueJob(store, {
      organizationId: "org_a",
      processorKey: "terminal",
      idempotencyKey: "job:terminal:1",
      payload: { orderId: "o2" },
      maxAttempts: 3,
      runAfter: "2020-01-01T00:00:00.000Z",
    });

    await processJobQueue(store, processors, new Date("2026-10-11T00:00:00.000Z"));
    const deadLetter = store.deadLetters[0]!;
    const originalIdempotencyKey = job.idempotencyKey;

    const replay = replayDeadLetter(store, {
      organizationId: "org_a",
      deadLetterId: deadLetter.id,
      replayedBy: "user_founder",
      resolutionNote: "Processor fixed",
      now: new Date("2026-10-11T00:01:00.000Z"),
    });

    assert.equal(replay.ok, true);
    if (!replay.ok) return;
    assert.equal(replay.job.id, job.id);
    assert.equal(replay.job.idempotencyKey, originalIdempotencyKey);
    assert.equal(replay.job.status, "queued");
    assert.equal(replay.job.attempts, 0);
    assert.equal(replay.deadLetter.status, "replayed");
    assert.equal(replay.deadLetter.replayCount, 1);
    assert.equal(replay.deadLetter.replayedBy, "user_founder");

    const duplicateReplay = replayDeadLetter(store, {
      organizationId: "org_a",
      deadLetterId: deadLetter.id,
      replayedBy: "user_founder",
    });
    assert.equal(duplicateReplay.ok, false);
    if (!duplicateReplay.ok) assert.equal(duplicateReplay.errorClass, "already_resolved");
  });

  it("requires runtime management authority and keeps tenant boundaries on replay", async () => {
    const runtime = createRuntimeService();
    runtime.registerProcessor({
      key: "terminal",
      handle: async () => ({ ok: false, error: "terminal", retryable: false }),
    });

    const job = enqueueJob(runtime.store, {
      organizationId: "org_a",
      processorKey: "terminal",
      idempotencyKey: "job:auth:1",
      payload: {},
      maxAttempts: 1,
      runAfter: "2020-01-01T00:00:00.000Z",
    });
    await runtime.processQueue({ organizationId: "org_a" });
    assert.equal(job.status, "dead_letter");
    const deadLetter = runtime.getDeadLetters("org_a")[0]!;

    const denied = runtime.replayDeadLetter(
      { organizationId: "org_a", userId: "staff_1", roleKey: "staff", permissions: [] },
      deadLetter.id
    );
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.errorClass, "authorization_error");

    const crossTenant = runtime.replayDeadLetter(
      { organizationId: "org_b", userId: "founder_1", roleKey: "founder" },
      deadLetter.id
    );
    assert.equal(crossTenant.ok, false);
    if (!crossTenant.ok) assert.equal(crossTenant.errorClass, "not_found");

    const allowed = runtime.replayDeadLetter(
      { organizationId: "org_a", userId: "founder_1", roleKey: "founder" },
      deadLetter.id,
      "Reviewed and approved replay"
    );
    assert.equal(allowed.ok, true);
    if (allowed.ok) assert.equal(allowed.job.status, "queued");
  });
});
