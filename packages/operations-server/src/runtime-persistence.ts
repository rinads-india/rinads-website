import type { RuntimePersistenceHooks } from "@rinads/runtime";
import {
  enqueueRuntimeJobToSupabase,
  persistExecutionSnapshot,
  persistRuntimeJob,
  type RuntimeSupabaseClient,
} from "./runtime-supabase";

export function createRuntimePersistenceHooks(
  client: RuntimeSupabaseClient,
  organizationId: string
): RuntimePersistenceHooks {
  return {
    onJobEnqueued: async (job) => {
      if (job.organizationId !== organizationId) return;
      await enqueueRuntimeJobToSupabase(client, job);
    },
    onJobUpdated: async (job) => {
      if (job.organizationId !== organizationId) return;
      await persistRuntimeJob(client, job);
    },
    onExecutionUpdated: async (execution) => {
      if (execution.organizationId !== organizationId) return;
      await persistExecutionSnapshot(client, execution);
    },
  };
}
