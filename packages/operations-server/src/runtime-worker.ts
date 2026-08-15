import {
  FulfilmentService,
  ReservationService,
  StockLedgerService,
  LowStockService,
  TaskService,
} from "@rinads/operations";
import { AlertEngine } from "@rinads/runtime";
import { loadCommerceStoreFromSupabase } from "@rinads/commerce-server";
import { createSupabaseRepositoryBundle } from "./factory";
import { loadOperationsStoreFromSupabase } from "./supabase";
import { wireRuntime } from "./runtime-wiring";
import {
  claimRuntimeJobs,
  loadRuntimeStoreFromSupabase,
  resetStaleRunningJobs,
  syncRuntimeArtifactsToSupabase,
  type RuntimeSupabaseClient,
} from "./runtime-supabase";
import { createRuntimePersistenceHooks } from "./runtime-persistence";

export type RunSupabaseRuntimeWorkerResult = {
  processed: number;
  failed: number;
  deadLetter: number;
  outboxSent: number;
  outboxFailed: number;
  workflows: number;
  claimed: number;
  staleReset: number;
};

export async function runSupabaseRuntimeWorker(
  client: RuntimeSupabaseClient,
  organizationId: string
): Promise<RunSupabaseRuntimeWorkerResult> {
  const staleReset = await resetStaleRunningJobs(client, organizationId, 10);

  await loadOperationsStoreFromSupabase(client, organizationId);
  await loadCommerceStoreFromSupabase(client, organizationId);

  const bundle = createSupabaseRepositoryBundle(organizationId, client);
  const opsRepo = bundle.opsRepo;

  const ledger = new StockLedgerService(opsRepo);
  const fulfilment = new FulfilmentService(opsRepo);
  const reservations = new ReservationService(opsRepo, ledger);
  const lowStock = new LowStockService(opsRepo, ledger);
  const tasks = new TaskService(opsRepo);
  const alertEngine = new AlertEngine(opsRepo);

  const partialStore = await loadRuntimeStoreFromSupabase(client, organizationId);
  const claimed = await claimRuntimeJobs(client, organizationId, 20);
  const persistenceHooks = createRuntimePersistenceHooks(client, organizationId);

  const runtime = wireRuntime(
    {
      opsRepo,
      fulfilment,
      reservations,
      lowStock,
      tasks,
      alertEngine,
    },
    { persistenceHooks }
  );

  runtime.hydrateStore(partialStore);
  for (const job of claimed) {
    const idx = runtime.store.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) runtime.store.jobs[idx] = job;
    else runtime.store.jobs.push(job);
  }

  runtime.initOrganization(organizationId);

  const result = await runtime.processQueue({
    organizationId,
    roleKey: "founder",
    permissions: ["org.manage", "commerce.order.read"],
  });

  await syncRuntimeArtifactsToSupabase(client, organizationId, runtime.store);

  return {
    processed: result.jobs.processed,
    failed: result.jobs.failed,
    deadLetter: result.jobs.deadLetter,
    outboxSent: result.outbox.sent,
    outboxFailed: result.outbox.failed,
    workflows: result.workflows,
    claimed: claimed.length,
    staleReset,
  };
}
