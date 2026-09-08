"use client";

import {
  MarketingPageShell,
  PageHero,
  VerticalCard,
  CTASection,
} from "@/components/system";
import { VERTICALS, VERTICAL_EXAMPLES } from "@/lib/content/verticals";

export function SolutionsClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Solutions"
        headline="Business OS → Vertical OS"
        summary="Start with the common RINADS core. Adopt industry-specific configuration when you need vertical depth — never OS inflation for every industry."
        primaryHref="/platform/business-os"
        primaryLabel="Business OS"
        secondaryHref="/signup"
        secondaryLabel="Start with RINADS"
      />
      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap gap-2">
            {VERTICAL_EXAMPLES.map((name) => (
              <span key={name} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {name}
              </span>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((v) => (
              <VerticalCard
                key={v.slug}
                name={v.name}
                type={v.type}
                summary={v.summary}
                href={`/solutions/${v.slug}`}
                status={v.status}
              />
            ))}
          </div>
        </div>
      </section>
      <CTASection headline="Configure your vertical on RINADS." />
    </MarketingPageShell>
  );
}
