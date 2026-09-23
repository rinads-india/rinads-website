"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
} from "@/components/system";
import { VerticalSolutionExperience } from "@/components/system/VerticalSolutionExperience";
import type { VerticalContent } from "@/lib/content/types";
import { getSolutionExperience } from "@/lib/solution-experience";

export function VerticalSolutionPage({ vertical }: { vertical: VerticalContent }) {
  const config = getSolutionExperience(vertical.slug);
  const available = vertical.status === "available";
  const primaryHref = available ? "/signup" : "/projects";
  const primaryLabel = available ? "Start with RINADS" : "Plan this solution";

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={(config?.publicName ?? vertical.name) + " · " + vertical.type}
        headline={vertical.headline}
        summary={vertical.summary}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref="/solutions"
        secondaryLabel="All solutions"
      />

      <VerticalSolutionExperience vertical={vertical} />

      <ModuleGrid
        title={"Configured capabilities"}
        modules={vertical.capabilities.map((capability) => ({ name: capability }))}
      />

      <section className="px-6 pb-14 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/platform/business-os"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/45"
            >
              Business OS →
            </Link>
            <Link
              href="/platform"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/45"
            >
              Platform →
            </Link>
          </div>
        </div>
      </section>

      <CTASection
        headline={
          available
            ? "Configure " + (config?.publicName ?? vertical.name) + " on RINADS."
            : "Shape the " + (config?.publicName ?? vertical.name) + " configuration with RINADS."
        }
        summary={
          available
            ? "Start with the shared RINADS core and configure the workflows this industry needs."
            : "This vertical is coming soon. Use RINPO or the project intake to define the operating requirements without assuming production availability."
        }
      />
    </MarketingPageShell>
  );
}
