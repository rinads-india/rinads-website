import Link from "next/link";
import { ProductStatus } from "@/components/system/ProductStatus";
import type { ProductStatusValue } from "@/lib/product-status";
import { fromLegacyAvailability } from "@/lib/product-status";

type VerticalCardProps = {
  name: string;
  type: string;
  summary: string;
  href: string;
  status?: ProductStatusValue | "available" | "coming";
};

export function VerticalCard({
  name,
  type,
  summary,
  href,
  status = "coming_soon",
}: VerticalCardProps) {
  const normalized = fromLegacyAvailability(status);

  return (
    <Link
      href={href}
      className="block border border-white/10 p-6 transition hover:border-rinads-primary/40"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{type}</p>
        <ProductStatus status={normalized} />
      </div>
      <h3 className="mt-3 text-lg font-bold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
    </Link>
  );
}
