/**
 * Pricing content — re-exports from commercialConfig / productCatalog.
 * Prefer importing from those modules for new code.
 */
export {
  COMMERCIAL_CONFIG,
  PRICE_APPROVED,
  PRICING_PLANS,
  PRICING_NOTES,
  PRICING_COMPARISON_ROWS,
  PRICING_FAQ,
  PRICING_TRUST_ITEMS,
  type PricingPlan,
} from "./commercialConfig";

export {
  OS_AVAILABILITY,
  getOsAvailability,
  type OperatingSystemAvailability,
} from "./productCatalog";
