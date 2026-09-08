"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  WorkflowDiagram,
  CTASection,
} from "@/components/system";
import type { OsPageContent } from "@/lib/content/types";

export function OsMarketingPage({ content }: { content: OsPageContent }) {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={content.eyebrow}
        headline={content.headline}
        summary={content.summary}
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/platform"
        secondaryLabel="Platform overview"
      />

      <ModuleGrid modules={content.modules} title={`${content.name} modules`} />

      <section className="border-y border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground">Where it sits in the stack</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every OS is operated through RINPO, running on RINADS Cloud.
          </p>
          <div className="mt-8">
            <WorkflowDiagram compact />
          </div>
        </div>
      </section>

      {content.related && content.related.length > 0 ? (
        <section className="px-6 py-12 md:px-12 lg:px-20">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
            {content.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-rinads-primary hover:underline"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <CTASection
        headline={`Operate with ${content.name}.`}
        summary="Talk to RINPO or start with RINADS to enter the platform."
      />
    </MarketingPageShell>
  );
}
