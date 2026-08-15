const MAX_CAUSATION_DEPTH = 20;
const DEDUPE_WINDOW_MS = 5000;

export type LoopGuardStore = {
  recentEvents: { organizationId: string; eventType: string; aggregateId?: string; at: number }[];
};

export function checkEventLoop(
  store: LoopGuardStore,
  input: { organizationId: string; eventType: string; aggregateId?: string; causationChain?: string[] }
): { allowed: true } | { allowed: false; reason: string } {
  if (input.causationChain && input.causationChain.length > MAX_CAUSATION_DEPTH) {
    return { allowed: false, reason: "Causation depth limit exceeded" };
  }

  const now = Date.now();
  store.recentEvents = store.recentEvents.filter((e) => now - e.at < DEDUPE_WINDOW_MS);

  const dup = store.recentEvents.find(
    (e) =>
      e.organizationId === input.organizationId &&
      e.eventType === input.eventType &&
      e.aggregateId === input.aggregateId
  );
  if (dup) {
    return { allowed: false, reason: "Duplicate event in dedupe window" };
  }

  store.recentEvents.push({
    organizationId: input.organizationId,
    eventType: input.eventType,
    aggregateId: input.aggregateId,
    at: now,
  });

  return { allowed: true };
}

export function detectCycle(eventTypes: string[]): boolean {
  const seen = new Set<string>();
  for (const t of eventTypes) {
    if (seen.has(t)) return true;
    seen.add(t);
  }
  return false;
}
