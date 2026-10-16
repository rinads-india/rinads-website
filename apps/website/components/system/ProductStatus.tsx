import {
  PRODUCT_STATUS_META,
  type ProductStatusValue,
  fromLegacyAvailability,
  statusTokenFor,
} from "@/lib/product-status";

type ProductStatusProps = {
  status: ProductStatusValue | "available" | "coming";
  size?: "sm" | "md";
  showDescription?: boolean;
  className?: string;
};

/**
 * Explicit product availability badge.
 * Status is always communicated with readable text — never colour alone.
 */
export function ProductStatus({
  status,
  size = "sm",
  showDescription = false,
  className = "",
}: ProductStatusProps) {
  const value = fromLegacyAvailability(status);
  const meta = PRODUCT_STATUS_META[value];
  const token = statusTokenFor(value);
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span className={`inline-flex flex-col gap-1 ${className}`}>
      <span
        className={`inline-flex w-fit items-center rounded-md border font-semibold uppercase tracking-[0.08em] ${sizeClass}`}
        style={{
          color: `var(--status-${token})`,
          backgroundColor: `var(--status-${token}-bg)`,
          borderColor: `var(--status-${token}-border)`,
        }}
        title={meta.description}
        aria-label={`Availability: ${meta.label}. ${meta.description}`}
      >
        {meta.label}
      </span>
      {showDescription ? (
        <span className="text-xs leading-5 text-muted-foreground">{meta.description}</span>
      ) : null}
    </span>
  );
}
