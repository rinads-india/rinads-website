/**
 * Stable Marketing OS domain events.
 * Emit these through @rinads/runtime business_events; do not create a parallel event bus.
 */
export const MARKETING_OS_EVENTS = [
  "marketing.content.created",
  "marketing.content.approved",
  "marketing.publication.scheduled",
  "marketing.publication.published",
  "marketing.publication.failed",
  "marketing.metric.updated",
  "marketing.metric.sync_completed",
  "marketing.channel.connected",
  "marketing.channel.degraded",
  "marketing.channel.accounts_synced",
  "marketing.campaign.created",
  "marketing.campaign.activated",
  "rinpo.recommendation.created",
  "rinpo.action.requested",
  "rinpo.action.approved",
  "rinpo.action.executed",
] as const;

export type MarketingOsEventName = (typeof MARKETING_OS_EVENTS)[number];

export function isMarketingOsEvent(name: string): name is MarketingOsEventName {
  return (MARKETING_OS_EVENTS as readonly string[]).includes(name);
}
