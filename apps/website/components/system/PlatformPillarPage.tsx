import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { AvailabilityBadge } from "@/components/system/AvailabilityBadge";
import { CTASection } from "@/components/system/CTASection";
import { MarketingPageShell } from "@/components/system/MarketingPageShell";
import { PageHero } from "@/components/system/PageHero";
import type { ProductStatusValue } from "@/lib/product-status";
import { CTAS } from "@/lib/ctas";

export type PlatformPillarCta = {
  label: string;
  href: string;
};

export type PlatformPillarPageProps = {
  path: string;
  eyebrow: string;
  title: string;
  /** Defaults to title when omitted */
  headline?: string;
  summary: string;
  status: ProductStatusValue;
  bullets: string[];
  primaryCta?: PlatformPillarCta;
  secondaryCta?: PlatformPillarCta;
  related?: Array<{ label: string; href: string }>;
  children?: ReactNode;
};

export function PlatformPillarPage({
  path,
  eyebrow,
  title,
  headline,
  summary,
  status,
  bullets,
  primaryCta = CTAS.bookDemo,
  secondaryCta = CTAS.explorePlatform,
  related,
  children,
}: PlatformPillarPageProps) {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Platform", path: "/platform" },
    { name: title, path },
  ];

  return (
    <>
      <CommercialJsonLd path={path} breadcrumbs={breadcrumbs} />
      <MarketingPageShell breadcrumbs={breadcrumbs}>
        <PageHero
          eyebrow={eyebrow}
          headline={headline ?? title}
          summary={summary}
          primaryHref={primaryCta.href}
          primaryLabel={primaryCta.label}
          secondaryHref={secondaryCta.href}
          secondaryLabel={secondaryCta.label}
          compactTop
        />

        <section className="px-6 pb-6 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <AvailabilityBadge status={status} size="md" showDescription />
          </div>
        </section>

        <section className="px-6 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              What this pillar coordinates
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {bullets.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm leading-6 text-[var(--text-primary)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {children}

        {related && related.length > 0 ? (
          <section className="px-6 pb-16 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Related platform areas
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {related.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/45"
                  >
                    {link.label}
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <CTASection
          headline={`Operate with ${title}.`}
          summary="Book a demo to see how this pillar connects to RINPO, Intelligence, Runtime, and your industry edition."
          primaryHref={primaryCta.href}
          primaryLabel={primaryCta.label}
        />
      </MarketingPageShell>
    </>
  );
}
