"use client";

import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
} from "@/components/system";
import type { AcademyProgram } from "@/lib/content/types";
import { ACADEMY_MODEL } from "@/lib/content/academy";

export function AcademyProgramPage({ program }: { program: AcademyProgram }) {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={program.name}
        headline={program.headline}
        summary={program.summary}
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/academy"
        secondaryLabel="All programs"
      />
      <section className="px-6 pb-8 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">Format</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {program.format.map((f) => (
              <span key={f} className="rounded-full border border-rinads-primary/30 px-3 py-1 text-xs text-white/80">
                {f}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {ACADEMY_MODEL.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-2 text-xs font-semibold">
                <span className="text-rinads-primary">{step}</span>
                {i < ACADEMY_MODEL.length - 1 ? <span className="text-white/30">→</span> : null}
              </span>
            ))}
          </div>
        </div>
      </section>
      <ModuleGrid
        title="Outcomes"
        modules={program.outcomes.map((o) => ({ name: o }))}
      />
      <CTASection headline={`Join ${program.name}.`} />
    </MarketingPageShell>
  );
}
