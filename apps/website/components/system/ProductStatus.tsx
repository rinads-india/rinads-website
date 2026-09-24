import {
  PRODUCT_STATUS_META,
  type ProductStatusValue,
  fromLegacyAvailability,
} from "@/lib/product-status";

type ProductStatusProps = {
  status: ProductStatusValue | "available" | "coming";
  size?: "sm" | "md";
  showDescription?: boolean;
  className?: string;
};

const TONE_CLASS: Record<ProductStatusValue, string> = {
  generally_available: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  available_configuration: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  private_preview: "border-amber-500/35 bg-amber-500/10 text-amber-200",
  prototype_demo: "border-white/20 bg-white/5 text-white/70",
  coming_soon: "border-white/15 bg-transparent text-white/45",
};

/**
 * Explicit product availability badge. Only the five approved states are shown.
 */
export function ProductStatus({
  status,
  size = "sm",
  showDescription = false,
  className = "",
}: ProductStatusProps) {
  const value = fromLegacyAvailability(status);
  const meta = PRODUCT_STATUS_META[value];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex flex-col gap-1 ${className}`}>
      <span
        className={`inline-flex w-fit items-center rounded-full border font-semibold uppercase tracking-[0.08em] ${sizeClass} ${TONE_CLASS[value]}`}
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
