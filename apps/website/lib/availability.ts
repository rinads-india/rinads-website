export type AvailabilityStatus =
  | "AVAILABLE"
  | "PREVIEW"
  | "PRIVATE_PREVIEW"
  | "COMING_SOON"
  | "ROADMAP";

export type CapabilityKey =
  | "business_os"
  | "rinpo_intelligence"
  | "rinads_cloud"
  | "rinads_services"
  | "ri_search"
  | "rinaspace"
  | "rinads_world"
  | "ri_marketplace"
  | "ri_entity"
  | "morning_digest"
  | "payment_checkout"
  | "whatsapp_notify"
  | "order_tracker"
  | "service_assignment";

export const PLATFORM_AVAILABILITY: Record<CapabilityKey, AvailabilityStatus> = {
  // Core products
  business_os: "AVAILABLE",
  rinpo_intelligence: "PREVIEW",
  rinads_cloud: "AVAILABLE",
  rinads_services: "AVAILABLE",

  // Discovery & workspace
  ri_search: "PREVIEW",      // Supabase-backed but not production-tested
  rinaspace: "PREVIEW",
  rinads_world: "PREVIEW",

  // Commerce
  ri_marketplace: "PREVIEW", // Built Phase 3, not production-tested
  payment_checkout: "AVAILABLE",

  // Intelligence & automation
  ri_entity: "PREVIEW",      // /entity/[slug] built Phase 2
  morning_digest: "PREVIEW",

  // Operations
  whatsapp_notify: "AVAILABLE",
  order_tracker: "AVAILABLE",
  service_assignment: "AVAILABLE",
};

export function getCapabilityStatus(key: CapabilityKey): AvailabilityStatus {
  return PLATFORM_AVAILABILITY[key];
}

export function isAvailable(key: CapabilityKey): boolean {
  return PLATFORM_AVAILABILITY[key] === "AVAILABLE";
}

export function isLive(key: CapabilityKey): boolean {
  const s = PLATFORM_AVAILABILITY[key];
  return s === "AVAILABLE" || s === "PREVIEW" || s === "PRIVATE_PREVIEW";
}

export const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Available",
  PREVIEW: "Preview",
  PRIVATE_PREVIEW: "Private Preview",
  COMING_SOON: "Coming Soon",
  ROADMAP: "Roadmap",
};
