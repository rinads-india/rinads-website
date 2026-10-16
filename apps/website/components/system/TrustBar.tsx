import Link from "next/link";
import { PRICING_TRUST_ITEMS } from "@/lib/content/commercialConfig";

type TrustBarProps = {
  items?: readonly { label: string; href?: string }[];
  className?: string;
};

/**
 * Compact trust strip — only verified platform claims.
 */
export function TrustBar({ items = PRICING_TRUST_ITEMS, className = "" }: TrustBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[var(--text-muted)] ${className}`}
      role="list"
      aria-label="Platform trust controls"
    >
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-3" role="listitem">
          {index > 0 ? <span aria-hidden className="text-[var(--text-muted)]/50">·</span> : null}
          {item.href ? (
            <Link
              href={item.href}
              className="font-semibold text-rinads-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
