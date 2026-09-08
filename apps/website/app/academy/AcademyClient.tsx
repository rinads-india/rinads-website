"use client";

import {
  MarketingPageShell,
  PageHero,
  CourseCard,
  LiveClassCard,
  CTASection,
} from "@/components/system";
import { ACADEMY_MODEL, ACADEMY_SUPPORT, ACADEMY_PROGRAMS } from "@/lib/content/academy";
import Link from "next/link";

export function AcademyClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Real Experience Academy"
        headline="Learn. Practice. Work. Ship. Measure. Improve. Certify."
        summary="Academy is not a content library. It is a real experience system — online, offline, hybrid — with RINPO as tutor."
        primaryHref="/academy/programs"
        primaryLabel="Browse programs"
        secondaryHref="/signup"
        secondaryLabel="Start with RINADS"
      />

      <section className="px-6 pb-12 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap gap-2">
            {ACADEMY_MODEL.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="rounded-full border border-rinads-primary/40 px-3 py-1 text-rinads-primary">
                  {step}
                </span>
                {i < ACADEMY_MODEL.length - 1 ? <span className="text-white/30">→</span> : null}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {ACADEMY_SUPPORT.map((item) => (
              <span key={item} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Schools & programs</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACADEMY_PROGRAMS.map((p) => (
              <CourseCard
                key={p.slug}
                name={p.name}
                summary={p.summary}
                href={`/academy/${p.slug}`}
                formats={p.format}
              />
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <LiveClassCard title="Founder Operating Cadence" schedule="Weekly live · Hybrid" mode="Live" />
            <LiveClassCard title="AI Filmmaking Studio" schedule="Weekend intensives · Offline" mode="Live" />
            <LiveClassCard title="Build OS Shipping Lab" schedule="Bi-weekly · Online" mode="Live" />
          </div>
          <Link href="/platform/academy-os" className="mt-8 inline-block text-sm font-semibold text-rinads-primary hover:underline">
            Academy OS on the platform →
          </Link>
        </div>
      </section>

      <CTASection
        headline="Train people who can ship."
        summary="Enter Academy through RINADS — with RINPO tutoring every step."
      />
    </MarketingPageShell>
  );
}
