/**
 * RINADS Runtime 2.0 worker — processes durable jobs, workflows, scheduler, outbox.
 * Run on schedule: pnpm runtime:worker
 */
import { wireRuntime } from "@rinads/operations-server";
import { createInMemoryOperationsRepository, syncRuntimeArtifactsToSupabase } from "@rinads/operations-server";
import {
  FulfilmentService,
  ReservationService,
  StockLedgerService,
  LowStockService,
  TaskService,
} from "@rinads/operations";
import { AlertEngine } from "@rinads/runtime";

async function main() {
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

  const orgId = process.env.RUNTIME_ORG_ID ?? "org_ambady_demo";
  runtime.initOrganization(orgId);
  const result = await runtime.processQueue({
    organizationId: orgId,
    roleKey: "founder",
    permissions: ["org.manage", "commerce.order.read"],
  });

  if (process.env.USE_SUPABASE === "1") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, key);
      await syncRuntimeArtifactsToSupabase(client as never, orgId, runtime.store);
    } else {
      console.error("Missing Supabase credentials for runtime worker");
      process.exit(1);
    }
  }

  console.log(JSON.stringify({ ok: true, ...result }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
