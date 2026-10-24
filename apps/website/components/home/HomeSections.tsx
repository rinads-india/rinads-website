"use client";

import Link from "next/link";
import { BusinessPulse } from "@/components/system/BusinessPulse";
import { BusinessGraph } from "@/components/system/BusinessGraph";
import { OutcomeGrid } from "@/components/system/OutcomeGrid";
import { IndustryEditionCard } from "@/components/system/IndustryEditionCard";
import { CTASection } from "@/components/system/CTASection";
import { ARCHITECTURE_LAYERS, POSITIONING } from "@/lib/product-ia";
import { CTAS } from "@/lib/ctas";
import { getPublicEditions } from "@/lib/content/solutionCatalog";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { trackMarketing } from "@/lib/analytics";

export function HomeSections() {
  const { openPhoneScreen } = useRinpo();
  const editions = getPublicEditions();

  return (
    <div className="relative z-10 space-y-24 bg-black pb-24 pt-16 text-white md:space-y-28 md:pt-20">
      <BusinessPulse />

      <BusinessGraph />

      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20" aria-labelledby="outcomes-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Outcome architecture
        </p>
        <h2 id="outcomes-heading" className="mt-2 text-2xl font-bold md:text-3xl">
          Four primary business outcomes
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
          How work actually moves: RUN · SELL · GROW · AUTOMATE — observed, understood, recommended,
          authorised, acted and audited.
        </p>
        <div className="mt-8">
          <OutcomeGrid />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20" aria-labelledby="rinpo-exp-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">RINPO</p>
        <h2 id="rinpo-exp-heading" className="mt-2 text-2xl font-bold md:text-3xl">
          Meet RINPO — your business intelligence, always available.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
          RINPO is the interface. RINADS INTELLIGENCE understands. RINPO RUNTIME executes — with
          permissions, approvals and audit.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              trackMarketing("rinpo_opened", { source: "home_rinpo_section" });
              openPhoneScreen("chat");
            }}
            className="min-h-12 rounded-xl bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {CTAS.talkToRinpo.label}
          </button>
          <Link
            href="/rinpo"
            className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            Meet RINPO
          </Link>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20"
        aria-labelledby="intel-runtime-heading"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Intelligence + Runtime
        </p>
        <h2 id="intel-runtime-heading" className="mt-2 text-2xl font-bold md:text-3xl">
          Understand, then execute under governance
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/platform/intelligence"
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            <h3 className="text-xl font-bold">RINADS Intelligence</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Observe · Understand · Recommend · Orchestrate. Model providers are routed behind
              RINADS INTELLIGENCE and remain replaceable.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              Explore Intelligence →
            </p>
          </Link>
          <Link
            href="/platform/rinpo-runtime"
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            <h3 className="text-xl font-bold">RINPO Runtime</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Agents, tools, workflows, triggers, permissions, approvals, execution and audit. AI
              must not receive unrestricted control over the business.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              Explore Runtime →
            </p>
          </Link>
        </div>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHITECTURE_LAYERS.map((layer) => (
            <li
              key={layer.id}
              className="rounded-xl border border-white/10 px-3 py-3 text-xs text-white/70"
            >
              <span className="font-semibold text-white">{layer.label}</span>
              <span className="mt-1 block leading-5">{layer.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20" aria-labelledby="editions-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Industry RINASPACES
        </p>
        <h2 id="editions-heading" className="mt-2 text-2xl font-bold md:text-3xl">
          Built for your industry
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
          Industry RINASPACES on the shared platform. Availability badges tell the truth — see{" "}
          <Link href="/trust/availability" className="text-rinads-primary underline-offset-4 hover:underline">
            /trust/availability
          </Link>
          .
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editions.map((edition) => (
            <IndustryEditionCard key={edition.slug} edition={edition} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20" aria-labelledby="evidence-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Customer evidence
        </p>
        <h2 id="evidence-heading" className="mt-2 text-2xl font-bold md:text-3xl">
          Verified proof only
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
          We do not invent testimonials, ROI percentages or deployment claims. Browse evidence classes
          when approved material exists.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { id: "stories", label: "Customer Stories" },
            { id: "deployments", label: "Deployments" },
            { id: "demonstrations", label: "Product Demonstrations" },
            { id: "labs", label: "RI LABS" },
          ].map((item) => (
            <Link
              key={item.id}
              href={`/customers#${item.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm font-semibold transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              {item.label}
              <span className="mt-2 block text-xs font-normal text-white/50">No unverified claims</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20" aria-labelledby="trust-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Security & governance
        </p>
        <h2 id="trust-heading" className="mt-2 text-2xl font-bold md:text-3xl">
          Identity, isolation, approvals and audit
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
          Every material AI action passes through RINPO Runtime policies. We do not claim
          certifications the company has not received.
        </p>
        <Link
          href="/trust/security"
          className="mt-6 inline-flex min-h-12 items-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
        >
          View Security →
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="rounded-3xl border border-rinads-primary/30 bg-rinads-primary/10 p-8 md:p-10">
          <h2 className="text-2xl font-bold md:text-3xl">Business Readiness</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            Assess how your operations are connected today. Receive a Business Operating Score and a
            suitable RINADS configuration — contact details only after meaningful value.
          </p>
          <Link
            href={CTAS.businessReadiness.href}
            onClick={() => trackMarketing("business_readiness_started", { source: "home" })}
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {CTAS.businessReadiness.label}
          </Link>
        </div>
      </section>

      <CTASection
        headline={POSITIONING.closing}
        summary="Meet RINPO, explore RINADS, or book a demo with the team."
        primaryHref={CTAS.bookDemo.href}
        primaryLabel={CTAS.bookDemo.label}
        secondaryHref={CTAS.exploreRinads.href}
        secondaryLabel={CTAS.exploreRinads.label}
      />
    </div>
  );
}
