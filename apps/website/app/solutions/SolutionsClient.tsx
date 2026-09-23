"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Layers3,
  Sparkles,
} from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  VerticalCard,
  CTASection,
} from "@/components/system";
import { VERTICALS } from "@/lib/content/verticals";
import { getSolutionExperience } from "@/lib/solution-experience";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const CONFIGURATION_MODEL = [
  {
    title: "Shared platform",
    description: "Identity, tenancy, permissions, data, runtime, and common platform services.",
    icon: Layers3,
  },
  {
    title: "Operating Systems",
    description: "Business, Commerce, Marketing, Logistics, Creative, Build, Academy, and Automation.",
    icon: Boxes,
  },
  {
    title: "Industry configuration",
    description: "Workflows, terminology, screens, integrations, and operating patterns adapted to the business.",
    icon: Building2,
  },
] as const;

export function SolutionsClient() {
  const { openPhoneScreen } = useRinpo();
  const available = VERTICALS.filter((vertical) => vertical.status === "available");
  const coming = VERTICALS.filter((vertical) => vertical.status === "coming");

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Industry Solutions"
        headline="One RINADS core. Configured for the business."
        summary="RINADS does not need a separate technology platform for every industry. The shared core stays consistent while workflows, terminology, modules, and integrations are configured around how each business operates."
        primaryHref="/platform"
        primaryLabel="Explore the platform"
        secondaryHref="/signup"
        secondaryLabel="Start with RINADS"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 lg:grid-cols-3">
            {CONFIGURATION_MODEL.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon size={19} className="text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 text-sm font-semibold text-[var(--text-muted)]">
            <span>Shared core</span>
            <span className="text-rinads-primary" aria-hidden>+</span>
            <span>Industry configuration</span>
            <span className="text-rinads-primary" aria-hidden>=</span>
            <span className="text-[var(--text-primary)]">Vertical solution</span>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                <CheckCircle2 size={14} className="text-[var(--status-success-fg)]" aria-hidden />
                Available configurations
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Start from a configuration that already exists.
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                openPhoneScreen(
                  "chat",
                  "Help me identify which available RINADS industry configuration best fits my business."
                )
              }
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              Ask RINPO
              <ArrowRight size={15} aria-hidden />
            </button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {available.map((vertical) => {
              const experience = getSolutionExperience(vertical.slug);
              return (
                <VerticalCard
                  key={vertical.slug}
                  name={experience?.publicName ?? vertical.name}
                  type={vertical.type}
                  summary={vertical.summary}
                  href={`/solutions/${vertical.slug}`}
                  status={vertical.status}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <Sparkles size={22} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Coming next</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Planned vertical depth on the same platform.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
                Coming-soon solution pages describe product direction and configuration models. They do not imply that a production vertical is already available.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {coming.map((vertical) => {
              const experience = getSolutionExperience(vertical.slug);
              return (
                <VerticalCard
                  key={vertical.slug}
                  name={experience?.publicName ?? vertical.name}
                  type={vertical.type}
                  summary={vertical.summary}
                  href={`/solutions/${vertical.slug}`}
                  status={vertical.status}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Custom configuration</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Your industry does not need to be on the list.
            </h2>
            <p className="mt-5 text-white/60">
              RINADS can start from the shared Business OS and platform primitives, then map the workflows, permissions, integrations, and terminology that make your operation specific.
            </p>
            <Link
              href="/projects"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
            >
              Start a project
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Workflow map", "How work enters, moves, waits, and completes."],
              ["Roles + permissions", "Who can see, approve, change, and execute."],
              ["Data model", "The business entities and relationships that matter."],
              ["Integrations", "Existing systems, providers, channels, and APIs."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/55">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Configure the platform around your operation."
        summary="Choose an available vertical, explore a coming-soon direction, or start from the shared RINADS core and define a custom workflow."
      />
    </MarketingPageShell>
  );
}
