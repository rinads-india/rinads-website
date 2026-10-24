"use client";

import {
  MarketingPageShell,
  PageHero,
  CTASection,
} from "@/components/system";
import { RinpoConsole } from "@/components/rinpo/RinpoConsole";
import { RINPO_ROLES, RINPO_CHANNELS } from "@/lib/content/services";
import Link from "next/link";

const OPERATING_SEQUENCE = [
  {
    step: "Observe",
    description: "Start from the current request, page, signal, or permitted business context.",
  },
  {
    step: "Understand",
    description: "RINPO and RINADS Intelligence interpret the context and what matters.",
  },
  {
    step: "Recommend",
    description: "RINPO explains the situation and proposes the next supported action.",
  },
  {
    step: "Authorize",
    description: "Meaningful actions remain inside permissions, policy, confirmation, and approval boundaries.",
  },
  {
    step: "Act",
    description: "Supported work executes through RINPO Runtime, registered tools, connectors, and business capabilities.",
  },
  {
    step: "Audit",
    description: "Governed actions can be recorded with business, workflow, and approval context.",
  },
] as const;

export function RinpoClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINPO"
        headline="The Business Intelligence Character for RINADS."
        summary="Talk to your business through one persistent interface. RINPO helps you understand what matters, review recommendations, authorize supported actions, and move governed work through RINPO Runtime."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a demo"
        secondaryHref="/platform/intelligence"
        secondaryLabel="RINADS Intelligence"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <RinpoConsole />
        </div>
      </section>

      <section className="border-y border-[var(--border)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
            How RINPO operates
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
            One interaction layer from observation to governed execution.
          </h2>

          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {OPERATING_SEQUENCE.map((item, index) => (
              <article
                key={item.step}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-rinads-primary" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">{item.step}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Roles</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RINPO_ROLES.map((role) => (
              <div key={role.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{role.name}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{role.description}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-bold text-[var(--text-primary)]">Channels</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {RINPO_CHANNELS.map((channel) => (
              <span
                key={channel}
                className="rounded-full border border-rinads-primary/30 bg-rinads-primary/5 px-4 py-2 text-sm text-[var(--text-primary)]"
              >
                {channel}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold text-rinads-primary">
            <Link href="/platform/intelligence">Intelligence →</Link>
            <Link href="/platform/rinpo-runtime">Runtime →</Link>
            <Link href="/rinpo/story">Story →</Link>
            <Link href="/rinpo/voice">Voice →</Link>
            <Link href="/rinpo/phone">Phone →</Link>
            {process.env.NEXT_PUBLIC_RINPO_UNITY_ENABLED === "true" && (
              <Link href="/rinpo/3d">3D preview →</Link>
            )}
          </div>
        </div>
      </section>

      <CTASection
        headline="Talk to RINPO."
        summary="RINPO is the Business Intelligence Character. RINADS Intelligence understands. RINPO Runtime executes supported work inside governed boundaries."
      />
    </MarketingPageShell>
  );
}
