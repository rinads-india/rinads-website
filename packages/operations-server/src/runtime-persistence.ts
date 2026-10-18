import type { RuntimePersistenceHooks } from "@rinads/runtime";
import {
  enqueueRuntimeJobToSupabase,
  persistDeadLetter,
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
    onDeadLetterUpdated: async (deadLetter) => {
      if (deadLetter.organizationId !== organizationId) return;
      await persistDeadLetter(client, deadLetter);
    },
    onExecutionUpdated: async (execution) => {
      if (execution.organizationId !== organizationId) return;
      await persistExecutionSnapshot(client, execution);
    },
  };
}
