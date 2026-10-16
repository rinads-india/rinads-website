"use client";

import Link from "next/link";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { CTAS } from "@/lib/product-ia";
import { trackMarketing } from "@/lib/analytics";

type CTASectionProps = {
  headline: string;
  summary?: string;
  className?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  showRinpo?: boolean;
  onPrimaryClick?: () => void;
};

export function CTASection({
  headline,
  summary,
  className = "",
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  showRinpo = true,
  onPrimaryClick,
}: CTASectionProps) {
  const { openPhoneScreen } = useRinpo();
  const primary = {
    href: primaryHref ?? CTAS.primary.href,
    label: primaryLabel ?? CTAS.primary.label,
  };
  const secondary = {
    href: secondaryHref ?? CTAS.secondary.href,
    label: secondaryLabel ?? CTAS.secondary.label,
  };

  return (
    <section className={`border-t border-white/10 px-6 py-20 md:px-12 lg:px-20 ${className}`}>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">{headline}</h2>
        {summary ? <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">{summary}</p> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primary.href}
            onClick={() => {
              onPrimaryClick?.();
              trackMarketing("demo_booking_started", { source: "cta_section" });
            }}
            className="inline-flex min-h-12 items-center rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {primary.label}
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {secondary.label}
          </Link>
          {showRinpo ? (
            <button
              type="button"
              onClick={() => {
                trackMarketing("rinpo_demo_started", { source: "cta_section" });
                openPhoneScreen("chat");
              }}
              className="inline-flex min-h-12 items-center rounded-full px-6 py-3 text-sm font-semibold text-rinads-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              {CTAS.rinpo.label}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
