/**
 * Product availability states for OS, verticals, integrations, and pricing.
 * Never invent production readiness — only these five labels are allowed.
 */
export const PRODUCT_STATUS_VALUES = [
  "generally_available",
  "available_configuration",
  "private_preview",
  "prototype_demo",
  "coming_soon",
] as const;

export type ProductStatusValue = (typeof PRODUCT_STATUS_VALUES)[number];

export type ProductStatusMeta = {
  value: ProductStatusValue;
  label: string;
  shortLabel: string;
  description: string;
  tone: "success" | "info" | "warning" | "neutral" | "muted";
};

export const PRODUCT_STATUS_META: Record<ProductStatusValue, ProductStatusMeta> = {
  generally_available: {
    value: "generally_available",
    label: "Available",
    shortLabel: "Available",
    description: "Available for production use under normal subscription terms.",
    tone: "success",
  },
  available_configuration: {
    value: "available_configuration",
    label: "Available configuration",
    shortLabel: "Config",
    description: "Can be configured for an organisation; may require implementation support.",
    tone: "info",
  },
  private_preview: {
    value: "private_preview",
    label: "Private preview",
    shortLabel: "Preview",
    description: "Limited access for invited organisations. Not general production availability.",
    tone: "warning",
  },
  prototype_demo: {
    value: "prototype_demo",
    label: "Prototype",
    shortLabel: "Prototype",
    description: "Demonstrates product direction with sample or synthetic data. Not a production workspace.",
    tone: "neutral",
  },
  coming_soon: {
    value: "coming_soon",
    label: "Coming soon",
    shortLabel: "Soon",
    description: "Planned capability. Not available for purchase or production use yet.",
    tone: "muted",
  },
};

/** CSS custom property token name for product status (never colour-only). */
export function statusTokenFor(status: ProductStatusValue): string {
  switch (status) {
    case "generally_available":
    case "available_configuration":
      return "available";
    case "private_preview":
      return "preview";
    case "prototype_demo":
      return "prototype";
    case "coming_soon":
      return "soon";
  }
}

/** Map legacy two-state vertical flags onto the product status standard. */
export function fromLegacyAvailability(
  status: "available" | "coming" | ProductStatusValue,
): ProductStatusValue {
  if (status === "available") return "available_configuration";
  if (status === "coming") return "coming_soon";
  return status;
}

export function isProductStatusValue(value: string): value is ProductStatusValue {
  return (PRODUCT_STATUS_VALUES as readonly string[]).includes(value);
}
