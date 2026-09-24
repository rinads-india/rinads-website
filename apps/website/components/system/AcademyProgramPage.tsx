"use client";

import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2 } from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
} from "@/components/system";
import type { AcademyProgram } from "@/lib/content/types";
import { ACADEMY_MODEL } from "@/lib/content/academy";
import { getAcademyExperience } from "@/lib/academy-experience";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

export function AcademyProgramPage({ program }: { program: AcademyProgram }) {
  const { openPhoneScreen } = useRinpo();
  const experience = getAcademyExperience(program.slug);

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={"RINADS Academy · " + program.name}
        headline={program.headline}
        summary={program.summary}
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/academy"
        secondaryLabel="All programs"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Format
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {program.format.map((format) => (
                  <span
                    key={format}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {format}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-[var(--text-muted)]">
                Delivery format describes how a program may be structured. Specific cohorts, dates, instructors, and schedules should only be treated as confirmed when published separately.
              </p>
            </article>

            <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Real Experience loop
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {ACADEMY_MODEL.map((step, index) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-rinads-primary/30 bg-rinads-primary/[0.04] px-3 py-1.5 text-xs font-semibold text-rinads-primary">
                      {step}
                    </span>
                    {index < ACADEMY_MODEL.length - 1 ? (
                      <ArrowRight size={13} className="text-[var(--text-muted)]" aria-hidden />
                    ) : null}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {experience ? (
        <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              How the program becomes experience
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["PRACTICE", experience.practice],
                ["WORK", experience.work],
                ["SHIP", experience.ship],
                ["MEASURE", experience.measure],
              ].map(([label, detail]) => (
                <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">{label}</p>
                  <p className="mt-3 text-sm leading-6 text-white/60">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ModuleGrid
        title="Expected outcomes"
        modules={program.outcomes.map((outcome) => ({ name: outcome }))}
      />

      {experience ? (
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Bot size={23} className="text-rinads-primary" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                  RINPO Tutor
                </p>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
                Use the program as a guided operating loop.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                RINPO can explain concepts, suggest practice, connect the skill to work, and help review the next useful improvement.
              </p>
              <button
                type="button"
                onClick={() => openPhoneScreen("chat", experience.rinpoPrompt)}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              >
                Ask RINPO about this path
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Evidence before certification
              </p>
              <div className="mt-5 space-y-3">
                {[
                  "Practice shows the learner can apply the concept.",
                  "Work connects the skill to an operating problem.",
                  "Shipping creates evidence beyond lesson completion.",
                  "Measurement identifies what still needs improvement.",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-[var(--border)] p-3">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-rinads-primary" aria-hidden />
                    <p className="text-sm leading-6 text-[var(--text-muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-6 pb-12 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <Link href="/platform/academy-os" className="text-sm font-semibold text-rinads-primary hover:underline">
            See Academy OS on the platform →
          </Link>
        </div>
      </section>

      <CTASection
        headline={"Build capability through " + program.name + "."}
        summary="Learn the concept, practice it, apply it to work, ship evidence, measure the result, and improve."
      />
    </MarketingPageShell>
  );
}
