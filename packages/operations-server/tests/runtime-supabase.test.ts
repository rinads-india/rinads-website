import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapDeadLetterRow,
  mapRuntimeJobRow,
  loadRuntimeStoreFromSupabase,
  claimRuntimeJobs,
  enqueueRuntimeJobToSupabase,
  syncRuntimeArtifactsToSupabase,
  type RuntimeSupabaseClient,
} from "../src/runtime-supabase";
import { createMemoryRuntimeStore } from "@rinads/runtime";

function createMockRuntimeClient(): RuntimeSupabaseClient & {
  tables: Map<string, Record<string, unknown>[]>;
  rpcCalls: { fn: string; args: Record<string, unknown> }[];
} {
  const tables = new Map<string, Record<string, unknown>[]>();
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];

  const client: RuntimeSupabaseClient & {
    tables: Map<string, Record<string, unknown>[]>;
    rpcCalls: { fn: string; args: Record<string, unknown> }[];
  } = {
    tables,
    rpcCalls,
    from(table: string) {
      if (!tables.has(table)) tables.set(table, []);
      return {
        select: () => ({
          eq: async (_col: string, val: string) => {
            const rows = (tables.get(table) ?? []).filter((r) => String(r.organization_id) === val);
            return { data: rows, error: null };
          },
        }),
        upsert: async (rows: Record<string, unknown>[]) => {
          const existing = tables.get(table) ?? [];
          for (const row of rows) {
            const id = String(row.id ?? `${table}_${existing.length}`);
            const idx = existing.findIndex((r) => String(r.id) === id);
            const stored = { ...row, id };
            if (idx >= 0) existing[idx] = stored;
            else existing.push(stored);
          }
          tables.set(table, existing);
          return { error: null };
        },
      };
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      if (fn === "claim_runtime_jobs") {
        const orgId = String(args.p_org_id);
        const limit = Number(args.p_limit ?? 10);
        const eligible = (tables.get("runtime_jobs") ?? []).filter(
          (r) =>
            String(r.organization_id) === orgId &&
            (r.status === "queued" || r.status === "failed")
        );
        const claimed = eligible.slice(0, limit).map((r) => ({ ...r, status: "running" }));
        for (const row of claimed) {
          const all = tables.get("runtime_jobs") ?? [];
          const idx = all.findIndex((r) => r.id === row.id);
          if (idx >= 0) all[idx] = row;
        }
        return { data: claimed, error: null };
      }
      if (fn === "reset_stale_runtime_jobs") {
        return { data: 0, error: null };
      }
      return { data: null, error: null };
    },
  };

  return client;
}

describe("Runtime Supabase persistence", () => {
  it("maps runtime job rows", () => {
    const job = mapRuntimeJobRow({
      id: "job_1",
      organization_id: "org_a",
      processor_key: "workflow_runner",
      idempotency_key: "wf:1",
      payload: { executionId: "wfx_1" },
      status: "queued",
      attempts: 0,
      max_attempts: 3,
      run_after: "2026-08-15T00:00:00.000Z",
      created_at: "2026-08-15T00:00:00.000Z",
      updated_at: "2026-08-15T00:00:00.000Z",
    });
    assert.equal(job.processorKey, "workflow_runner");
    assert.equal(job.organizationId, "org_a");
  });

  it("maps legacy and replay-aware dead-letter rows", () => {
    const legacy = mapDeadLetterRow({
      id: "dlq_legacy",
      organization_id: "org_a",
      source_type: "job",
      source_id: "job_legacy",
      error_message: "failed",
      payload: {},
      created_at: "2026-08-15T00:00:00.000Z",
    });
    assert.equal(legacy.status, "open");
    assert.equal(legacy.replayCount, 0);

    const replayed = mapDeadLetterRow({
      id: "dlq_2",
      organization_id: "org_a",
      source_type: "job",
      source_id: "job_2",
      error_message: "failed",
      payload: {},
      status: "replayed",
      replay_count: 1,
      replayed_by: "founder_1",
      created_at: "2026-08-15T00:00:00.000Z",
      updated_at: "2026-08-15T00:01:00.000Z",
    });
    assert.equal(replayed.status, "replayed");
    assert.equal(replayed.replayCount, 1);
    assert.equal(replayed.replayedBy, "founder_1");
  });

  it("enqueues and loads runtime jobs", async () => {
    const client = createMockRuntimeClient();
    const orgId = "org_persist";

    await enqueueRuntimeJobToSupabase(client, {
      id: "job_1",
      organizationId: orgId,
      processorKey: "workflow_runner",
      idempotencyKey: "wf:1",
      payload: {},
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      runAfter: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const partial = await loadRuntimeStoreFromSupabase(client, orgId);
    assert.equal(partial.jobs?.length, 1);
  });

  it("keeps dead-letter source jobs hydrated so authorized replay can reset the original job", async () => {
    const client = createMockRuntimeClient();
    const orgId = "org_replay";
    client.tables.set("runtime_jobs", [
      {
        id: "job_dead",
        organization_id: orgId,
        processor_key: "workflow_runner",
        idempotency_key: "wf:dead",
        payload: {},
        status: "dead_letter",
        attempts: 3,
        max_attempts: 3,
        last_error: "terminal",
        run_after: "2026-10-11T00:00:00.000Z",
        created_at: "2026-10-11T00:00:00.000Z",
        updated_at: "2026-10-11T00:00:00.000Z",
      },
    ]);
    client.tables.set("runtime_dead_letters", [
      {
        id: "dlq_dead",
        organization_id: orgId,
        source_type: "job",
        source_id: "job_dead",
        error_message: "terminal",
        payload: {},
        status: "open",
        replay_count: 0,
        created_at: "2026-10-11T00:00:00.000Z",
        updated_at: "2026-10-11T00:00:00.000Z",
      },
    ]);

    const partial = await loadRuntimeStoreFromSupabase(client, orgId);
    assert.equal(partial.jobs?.[0]?.status, "dead_letter");
    assert.equal(partial.deadLetters?.[0]?.status, "open");
  });

  it("claims eligible jobs via rpc", async () => {
    const client = createMockRuntimeClient();
    const orgId = "org_claim";
    client.tables.set("runtime_jobs", [
      {
        id: "job_q",
        organization_id: orgId,
        processor_key: "reservation_expiry",
        idempotency_key: "sch:1",
        payload: {},
        status: "queued",
        attempts: 0,
        max_attempts: 3,
        run_after: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const claimed = await claimRuntimeJobs(client, orgId, 5);
    assert.equal(claimed.length, 1);
    assert.equal(claimed[0]?.status, "running");
    assert.equal(client.rpcCalls[0]?.fn, "claim_runtime_jobs");
  });

  it("syncs execution snapshots with artifacts", async () => {
    const client = createMockRuntimeClient();
    const orgId = "org_sync";
    const store = createMemoryRuntimeStore();
    store.executions.push({
      id: "wfx_1",
      organizationId: orgId,
      workflowKey: "order-fulfilment-v1",
      status: "queued",
      correlationId: "corr_1",
      inputPayload: { orderId: "o1" },
      stepRuns: [],
      iterationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    store.deadLetters.push({
      id: "dlq_sync",
      organizationId: orgId,
      sourceType: "job",
      sourceId: "job_sync",
      errorMessage: "failed",
      payload: {},
      status: "replayed",
      replayCount: 1,
      replayedAt: "2026-10-11T00:01:00.000Z",
      replayedBy: "founder_1",
      createdAt: "2026-10-11T00:00:00.000Z",
      updatedAt: "2026-10-11T00:01:00.000Z",
    });

    await syncRuntimeArtifactsToSupabase(client, orgId, store);
    assert.equal((client.tables.get("runtime_execution_snapshots") ?? []).length, 1);
    const dlq = (client.tables.get("runtime_dead_letters") ?? [])[0];
    assert.equal(dlq?.status, "replayed");
    assert.equal(dlq?.replay_count, 1);
  });
});
