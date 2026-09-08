"use client";

import {
  MarketingPageShell,
  PageHero,
  PlatformCard,
  WorkflowDiagram,
  CTASection,
} from "@/components/system";
import { PLATFORM_OVERVIEW } from "@/lib/content/platform-os";
import { PLATFORM_OS } from "@/lib/product-ia";

export function PlatformClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={PLATFORM_OVERVIEW.eyebrow}
        headline={PLATFORM_OVERVIEW.headline}
        summary={PLATFORM_OVERVIEW.summary}
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/rinpo"
        secondaryLabel="Meet RINPO"
      />

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground">Core architecture</h2>
          <div className="mt-8">
            <WorkflowDiagram />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Operating systems</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_OS.map((os) => (
              <PlatformCard
                key={os.href}
                title={os.label}
                description={os.description ?? ""}
                href={os.href}
              />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="One intelligent platform."
        summary="RINPO is the interface. RINADS Intelligence is the brain. RINADS is the operating platform."
      />
    </MarketingPageShell>
  );
}
