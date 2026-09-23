"use client";

import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Layers3 } from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
} from "@/components/system";
import type { ServiceLine } from "@/lib/content/types";
import { getServiceExperience } from "@/lib/service-experience";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

export function ServiceLinePage({ service }: { service: ServiceLine }) {
  const { openPhoneScreen } = useRinpo();
  const experience = getServiceExperience(service.slug);

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={"Services · " + (experience?.publicVerb ?? service.verb)}
        headline={service.headline}
        summary={service.summary}
        primaryHref="/projects"
        primaryLabel="Start a project"
        secondaryHref="/services"
        secondaryLabel="All services"
      />

      {experience ? (
        <>
          <section className="px-6 pb-20 md:px-12 lg:px-20">
            <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                  Outcome
                </p>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {experience.publicName}
                </h2>
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{experience.outcome}</p>
              </article>

              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6">
                <div className="flex items-center gap-3">
                  <Layers3 size={20} className="text-rinads-primary" aria-hidden />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                    Platform connection
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {experience.platform.map((item) => (
                    <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Delivery process
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                A delivery path with a clear beginning and handover.
              </h2>
              <div className="mt-10 overflow-x-auto pb-2">
                <ol className="flex min-w-max items-center">
                  {experience.process.map((step, index) => (
                    <li key={step} className="flex items-center">
                      <span className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold">
                        {step}
                      </span>
                      {index < experience.process.length - 1 ? (
                        <ArrowRight size={16} className="mx-2 text-rinads-primary/70" aria-hidden />
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <ModuleGrid title="Deliverables & capabilities" modules={service.offerings.map((offering) => ({ name: offering }))} />

      {experience ? (
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Bot size={22} className="text-rinads-primary" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                  RINPO project guide
                </p>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
                Turn the request into a structured scope.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                Use RINPO to clarify the outcome, constraints, platform fit, and likely delivery path before the engagement starts.
              </p>
              <button
                type="button"
                onClick={() => openPhoneScreen("chat", experience.rinpoPrompt)}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              >
                Scope with RINPO
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Engagement principles
              </p>
              <div className="mt-5 space-y-3">
                {[
                  "Start from the business outcome.",
                  "Reuse platform capability before creating one-off systems.",
                  "Keep permissions, approvals, data ownership, and operations visible.",
                  "Hand over something the business can continue to operate.",
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
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
          <Link href="/platform" className="text-sm font-semibold text-rinads-primary hover:underline">
            Explore the platform →
          </Link>
          <Link href="/services" className="text-sm font-semibold text-rinads-primary hover:underline">
            All services →
          </Link>
        </div>
      </section>

      <CTASection
        headline={(experience?.publicVerb ?? service.verb) + " with RINADS."}
        summary="Start a project with a clear outcome, platform fit, delivery path, and operational handover."
      />
    </MarketingPageShell>
  );
}
