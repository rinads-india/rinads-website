import type { EventEmitterStore } from "../events/emit";
import type { JobQueueStore } from "../queue/durable-queue";
import type { WorkflowStore } from "../workflow/engine";
import type { ApprovalStore, TenantPolicy } from "../approval/approval";
import type { OutboxStore } from "../outbox/outbox";
import type { SchedulerStore } from "../scheduler/scheduler";
import type { LoopGuardStore } from "../loop-guard";

let idCounter = 0;

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
    nextId(prefix: string) {
      idCounter++;
      return `${prefix}_${idCounter}_${Date.now().toString(36)}`;
    },
  };
}

export type MemoryRuntimeStore = ReturnType<typeof createMemoryRuntimeStore>;
