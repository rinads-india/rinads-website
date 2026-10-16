/**
 * Product availability states for OS, verticals, integrations, and pricing.
 * Exactly four public readiness states — never invent production readiness.
 */
export const PRODUCT_STATUS_VALUES = [
  "available",
  "pilot",
  "preview",
  "roadmap",
] as const;

export type ProductStatusValue = (typeof PRODUCT_STATUS_VALUES)[number];

/** @deprecated Legacy five-state values — mapped via migrateLegacyStatus. */
export type LegacyProductStatusValue =
  | "generally_available"
  | "available_configuration"
  | "private_preview"
  | "prototype_demo"
  | "coming_soon";

export type ProductStatusMeta = {
  value: ProductStatusValue;
  label: string;
  shortLabel: string;
  description: string;
  tone: "success" | "info" | "warning" | "neutral" | "muted";
};

export const PRODUCT_STATUS_META: Record<ProductStatusValue, ProductStatusMeta> = {
  available: {
    value: "available",
    label: "Available",
    shortLabel: "Available",
    description: "Available for production use under normal subscription terms.",
    tone: "success",
  },
  pilot: {
    value: "pilot",
    label: "Pilot",
    shortLabel: "Pilot",
    description:
      "Can be configured for an organisation; may require implementation support or pilot scope.",
    tone: "info",
  },
  preview: {
    value: "preview",
    label: "Preview",
    shortLabel: "Preview",
    description:
      "Limited access or demonstrative sample/synthetic experiences. Not general production availability.",
    tone: "warning",
  },
  roadmap: {
    value: "roadmap",
    label: "Roadmap",
    shortLabel: "Roadmap",
    description: "Planned capability. Not available for purchase or production use yet.",
    tone: "muted",
  },
};

export function migrateLegacyStatus(
  status: ProductStatusValue | LegacyProductStatusValue | string,
): ProductStatusValue {
  switch (status) {
    case "available":
    case "generally_available":
      return "available";
    case "pilot":
    case "available_configuration":
      return "pilot";
    case "preview":
    case "private_preview":
    case "prototype_demo":
      return "preview";
    case "roadmap":
    case "coming_soon":
      return "roadmap";
    default:
      return "roadmap";
  }
}

/** CSS custom property token name for product status (never colour-only). */
export function statusTokenFor(status: ProductStatusValue): string {
  switch (status) {
    case "available":
      return "available";
    case "pilot":
      return "pilot";
    case "preview":
      return "preview";
    case "roadmap":
      return "roadmap";
  }
}

/** Map legacy two-state vertical flags onto the product status standard. */
export function fromLegacyAvailability(
  status: "available" | "coming" | ProductStatusValue | LegacyProductStatusValue,
): ProductStatusValue {
  if (status === "available") return "pilot";
  if (status === "coming") return "roadmap";
  return migrateLegacyStatus(status);
}

export function isProductStatusValue(value: string): value is ProductStatusValue {
  return (PRODUCT_STATUS_VALUES as readonly string[]).includes(value);
}
