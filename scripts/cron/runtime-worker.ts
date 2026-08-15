/**
 * RINADS Runtime 2.0 worker — Supabase-backed durable job processing.
 * Run on schedule: pnpm runtime:worker
 */
import { runSupabaseRuntimeWorker } from "@rinads/operations-server";
import { wireRuntime } from "@rinads/operations-server";
import { createInMemoryOperationsRepository } from "@rinads/operations-server";
import {
  FulfilmentService,
  ReservationService,
  StockLedgerService,
  LowStockService,
  TaskService,
} from "@rinads/operations";
import { AlertEngine } from "@rinads/runtime";

async function runDemoWorker(orgId: string) {
  const opsRepo = createInMemoryOperationsRepository();
  const ledger = new StockLedgerService(opsRepo);
  const fulfilment = new FulfilmentService(opsRepo);
  const reservations = new ReservationService(opsRepo, ledger);
  const lowStock = new LowStockService(opsRepo, ledger);
  const tasks = new TaskService(opsRepo);
  const alertEngine = new AlertEngine(opsRepo);

  const runtime = wireRuntime({
    opsRepo,
    fulfilment,
    reservations,
    lowStock,
    tasks,
    alertEngine,
  });

  runtime.initOrganization(orgId);
  const result = await runtime.processQueue({
    organizationId: orgId,
    roleKey: "founder",
    permissions: ["org.manage", "commerce.order.read"],
  });

  console.log(JSON.stringify({ ok: true, mode: "demo", ...result }));
}

async function main() {
  const orgId = process.env.RUNTIME_ORG_ID ?? "org_ambady_demo";

  if (process.env.USE_SUPABASE !== "1") {
    await runDemoWorker(orgId);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase credentials for runtime worker");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const result = await runSupabaseRuntimeWorker(client as never, orgId);
  console.log(JSON.stringify({ ok: true, mode: "supabase", ...result }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
