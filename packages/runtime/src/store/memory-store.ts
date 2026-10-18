import type { EventEmitterStore } from "../events/emit";
import type { JobQueueStore } from "../queue/durable-queue";
import type { WorkflowStore } from "../workflow/engine";
import type { ApprovalStore, TenantPolicy } from "../approval/approval";
import type { OutboxStore } from "../outbox/outbox";
import type { SchedulerStore } from "../scheduler/scheduler";
import type { LoopGuardStore } from "../loop-guard";

function createRuntimeId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("RINPO Runtime requires crypto.randomUUID() for persistence-safe identities");
  }
  return globalThis.crypto.randomUUID();
}

export function createMemoryRuntimeStore(): EventEmitterStore &
  JobQueueStore &
  WorkflowStore &
  ApprovalStore & {
    policies: TenantPolicy[];
  } & OutboxStore &
  SchedulerStore &
  LoopGuardStore & {
    nextId: (prefix: string) => string;
  } {
  return {
    events: [],
    jobs: [],
    deadLetters: [],
    executions: [],
    approvals: [],
    policies: [],
    messages: [],
    schedules: [],
    recentEvents: [],
    nextId(_prefix: string) {
      // Runtime persistence tables use UUID primary/foreign keys. Prefixes are retained in
      // the API signature only for call-site readability and must never alter persisted IDs.
      return createRuntimeId();
    },
  };
}

export type MemoryRuntimeStore = ReturnType<typeof createMemoryRuntimeStore>;
