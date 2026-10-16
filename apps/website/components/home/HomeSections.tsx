"use client";

import Link from "next/link";
import {
  CTASection,
  OutcomeGrid,
  IndustryCard,
  ProductStatus,
  ProofBlock,
  TrustBar,
} from "@/components/system";
import { getProductsByGroup } from "@/lib/content/productCatalog";
import { getSolutionsSortedByDepth } from "@/lib/content/solutionCatalog";
import {
  COMMERCIAL_CONFIG,
  PRICE_APPROVED,
  PRICING_PLANS,
} from "@/lib/content/commercialConfig";
import { trackMarketing } from "@/lib/analytics";

const RINPO_STEPS = ["ASK", "UNDERSTAND", "RECOMMEND", "APPROVE", "ACT", "AUDIT"] as const;

export function HomeSections() {
  const availableNow = getProductsByGroup("now");
  const preview = getProductsByGroup("preview");
  const depthSolutions = getSolutionsSortedByDepth();

  return (
    <>
      {/* Section 2 — Business outcomes */}
      <section className="border-t border-white/10 px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">What do you want to improve?</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Start from the outcome — then open the RINADS system that fits.
          </p>
          <div className="mt-10">
            <OutcomeGrid />
          </div>
        </div>
      </section>

      {/* Section 3 — How RINPO works */}
      <section className="border-t border-white/10 bg-white/[0.02] px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">How RINPO works</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            RINPO is the persistent AI interface across RINADS. It can understand permitted business
            context, explain what matters, prepare next steps and route supported actions through the
            appropriate permissions and approval paths.
          </p>
          <ol className="mt-10 flex flex-wrap items-center gap-2 md:gap-3" aria-label="RINPO process">
            {RINPO_STEPS.map((step, index) => (
              <li key={step} className="inline-flex items-center gap-2 md:gap-3">
                {index > 0 ? (
                  <span aria-hidden className="text-rinads-primary">
                    →
                  </span>
                ) : null}
                <span className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold tracking-[0.12em] text-foreground sm:text-sm">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/rinpo"
            className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-rinads-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            See how RINPO works →
          </Link>
        </div>
      </section>

      {/* Section 4 — Product availability */}
      <section className="border-t border-white/10 px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">What is available now</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Production-supportable products stay clearly separated from preview and roadmap work.
          </p>

          <div className="mt-10">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-rinads-primary">
              Available / configurable now
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableNow.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  onClick={() =>
                    trackMarketing("platform_card_clicked", { product: product.slug, group: "now" })
                  }
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 p-4 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                >
                  <div>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.description}</p>
                  </div>
                  <ProductStatus status={product.status} />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Preview & roadmap
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((product) => (
                <Link
                  key={product.id}
                  href={product.href}
                  onClick={() =>
                    trackMarketing("platform_card_clicked", {
                      product: product.slug,
                      group: "preview",
                    })
                  }
                  className="flex items-start justify-between gap-3 rounded-xl border border-dashed border-white/10 p-4 opacity-90 transition hover:border-rinads-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                >
                  <div>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.description}</p>
                  </div>
                  <ProductStatus status={product.status} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — Industry solutions */}
      <section className="border-t border-white/10 bg-white/[0.02] px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Configured around how your business works.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Shared RINADS core + operating systems + industry configuration + RINPO context.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {depthSolutions.map((solution) => (
              <IndustryCard key={solution.slug} solution={solution} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — Proof */}
      <section className="border-t border-white/10 px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Implementation, not theatre</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            We publish customer stories only after approval. Until then, we stand behind platform honesty.
          </p>
          <div className="mt-8">
            <ProofBlock
              fallback={{
                headline: "Built for real operating workflows",
                body: "RINADS is designed and delivered from Thrissur, Kerala, for growing businesses that need connected customers, work, commerce and automation — with RINPO as a governed AI interface, not a marketing chatbot.",
                ctaHref: "/contact?intent=implementation",
                ctaLabel: "Talk implementation",
              }}
            />
          </div>
        </div>
      </section>

      {/* Section 7 — Pricing entry */}
      <section className="border-t border-white/10 px-6 py-16 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {COMMERCIAL_CONFIG.homepageTeaser}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {PRICE_APPROVED
              ? "Approved plan rates are shown on the pricing page."
              : COMMERCIAL_CONFIG.configuredPricingExplanation}
          </p>
          <div className="mt-8">
            <TrustBar className="justify-start" />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLANS.map((plan) => (
              <Link
                key={plan.id}
                href="/pricing"
                onClick={() => trackMarketing("pricing_plan_selected", { plan: plan.id, source: "home" })}
                className="rounded-xl border border-white/10 p-4 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              >
                <p className="font-bold text-foreground">{plan.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {PRICE_APPROVED && typeof plan.monthlyPrice === "number"
                    ? `Starting at ₹${plan.monthlyPrice.toLocaleString("en-IN")}/month`
                    : COMMERCIAL_CONFIG.configuredPricingLabel}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{plan.targetCustomer}</p>
              </Link>
            ))}
          </div>
          <Link
            href={COMMERCIAL_CONFIG.estimateCta.href}
            onClick={() => trackMarketing("pricing_estimate_started", { source: "home" })}
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {COMMERCIAL_CONFIG.estimateCta.label}
          </Link>
        </div>
      </section>

      {/* Section 8 — Final CTA */}
      <CTASection
        headline="Ready to see RINADS on your workflow?"
        summary="Try RINPO, explore Business OS, or book a demo — pick the path that matches your intent."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a demo"
        secondaryHref="/platform/business-os"
        secondaryLabel="Explore Business OS"
        showRinpo
      />
    </>
  );
}
