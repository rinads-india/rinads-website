export type ScheduleDefinition = {
  id: string;
  organizationId: string;
  processorKey: string;
  cronExpression: string;
  misfirePolicy: "skip" | "run_once" | "catch_up_limited";
  isPaused: boolean;
  lastRunAt?: string;
};

export type SchedulerStore = {
  schedules: ScheduleDefinition[];
};

export const DEFAULT_SCHEDULES: Omit<ScheduleDefinition, "id" | "organizationId">[] = [
  { processorKey: "reservation_expiry", cronExpression: "*/5 * * * *", misfirePolicy: "run_once", isPaused: false },
  { processorKey: "low_stock_scan", cronExpression: "0 * * * *", misfirePolicy: "run_once", isPaused: false },
];

export function seedSchedulesForOrg(store: SchedulerStore, organizationId: string, nextId: (p: string) => string): void {
  for (const def of DEFAULT_SCHEDULES) {
    const exists = store.schedules.some(
      (s) => s.organizationId === organizationId && s.processorKey === def.processorKey
    );
    if (!exists) {
      store.schedules.push({ id: nextId("sch"), organizationId, ...def });
    }
  }
}

/** Simplified tick: enqueue processor jobs for all non-paused schedules (cron parsing deferred). */
export function tickScheduler(
  store: SchedulerStore,
  enqueue: (orgId: string, processorKey: string) => void
): number {
  let enqueued = 0;
  const now = Date.now();
  for (const schedule of store.schedules) {
    if (schedule.isPaused) continue;
    const last = schedule.lastRunAt ? new Date(schedule.lastRunAt).getTime() : 0;
    const intervalMs = schedule.processorKey === "reservation_expiry" ? 5 * 60 * 1000 : 60 * 60 * 1000;
    if (now - last >= intervalMs) {
      enqueue(schedule.organizationId, schedule.processorKey);
      schedule.lastRunAt = new Date().toISOString();
      enqueued++;
    }
  }
  return enqueued;
}
