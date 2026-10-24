import { ProductStatus } from "@/components/system/ProductStatus";
import type { ProductStatusValue } from "@/lib/product-status";

type AvailabilityBadgeProps = {
  status: ProductStatusValue | "available" | "coming";
  size?: "sm" | "md";
  showDescription?: boolean;
  className?: string;
};

/**
 * Concise public availability badge — exactly four readiness states.
 * Long-form explanations live on /trust/availability.
 */
export function AvailabilityBadge({
  status,
  size = "sm",
  showDescription = false,
  className = "",
}: AvailabilityBadgeProps) {
  return (
    <ProductStatus
      status={status}
      size={size}
      showDescription={showDescription}
      className={className}
    />
  );
}
