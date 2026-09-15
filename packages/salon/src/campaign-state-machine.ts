import type { CampaignStatus } from "./types";

/**
 * Campaign lifecycle: draft -> approved -> sending -> completed/
 * partially_failed/failed, with cancellation available any time before
 * sending has actually started. Terminal states never transition — the
 * `sending -> completed/partially_failed/failed` transitions are only ever
 * applied by the `salon_recompute_campaign_counts()` DB trigger (based on
 * real recipient outcomes), never guessed by application code; this state
 * machine exists to gate the transitions application code *is* allowed to
 * request (create, approve, send, cancel), mirroring
 * `state-machine.ts`'s `TRANSITIONS` map style for appointments.
 */
const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["approved", "cancelled"],
  approved: ["sending", "cancelled"],
  sending: ["completed", "partially_failed", "failed"],
  completed: [],
  partially_failed: [],
  failed: [],
  cancelled: [],
};

export function nextCampaignStatuses(from: CampaignStatus): CampaignStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransitionCampaignStatus(from: CampaignStatus, to: CampaignStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalCampaignStatus(status: CampaignStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
