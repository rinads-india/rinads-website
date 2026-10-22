"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  MarketingPageShell,
  PageHero,
  ProductStatus,
  CTASection,
  TrustBar,
  FAQAccordion,
  PricingComparison,
  Breadcrumbs,
} from "@/components/system";
import {
  COMMERCIAL_CONFIG,
  INDUSTRY_PACKS,
  OS_AVAILABILITY,
  PRICE_APPROVED,
  PRICING_FAQ,
  PRICING_NOTES,
  PRICING_PLANS,
  SERVICE_LAYERS,
  SHOPIFY_PACKAGES,
  type CommercialLayer,
  type PricingPlan,
} from "@/lib/content/commercialConfig";
import { trackMarketing } from "@/lib/analytics";
import { PricingEstimator } from "./PricingEstimator";

function priceLabel(plan: PricingPlan): { primary: string; secondary: string } {
  if (PRICE_APPROVED && typeof plan.monthlyPrice === "number") {
    return {
      primary:
        plan.id === "enterprise"
          ? `From ₹${plan.monthlyPrice.toLocaleString("en-IN")}/month`
          : `₹${plan.monthlyPrice.toLocaleString("en-IN")}/month`,
      secondary:
        typeof plan.annualPrice === "number"
          ? `₹${plan.annualPrice.toLocaleString("en-IN")} annually`
          : "Annual enterprise contract available",
    };
  }
  return {
    primary: COMMERCIAL_CONFIG.configuredPricingLabel,
    secondary: COMMERCIAL_CONFIG.configuredPricingExplanation,
  };
}

function CommercialCard({ item }: { item: CommercialLayer }) {
  return (
    <article className="border border-white/10 bg-white/[0.02] p-5">
      <div className="flex min-h-24 flex-col justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">{item.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
        </div>
        <p className="text-lg font-black text-foreground">{item.price}</p>
      </div>
      {item.note ? <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.note}</p> : null}
      {item.href ? (
        item.href.startsWith("http") ? (
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-rinads-primary hover:underline"
          >
            Explore
          </a>
        ) : (
          <Link href={item.href} className="mt-4 inline-flex text-sm font-semibold text-rinads-primary hover:underline">
            Explore
          </Link>
        )
      ) : null}
    </article>
  );
}

export function PricingClient() {
  useEffect(() => {
    trackMarketing("pricing_viewed", { path: "/pricing" });
  }, []);

  return (
    <MarketingPageShell>
      <div className="px-6 pt-28 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Pricing", path: "/pricing" },
            ]}
          />
        </div>
      </div>

      <PageHero
        eyebrow="Pricing"
        headline={COMMERCIAL_CONFIG.homepageTeaser}
        summary="Start with the RINADS platform, then add industry configuration, RI usage, implementation and managed services only when your business requires them."
        primaryHref={COMMERCIAL_CONFIG.estimateCta.href}
        primaryLabel={COMMERCIAL_CONFIG.estimateCta.label}
        secondaryHref="/contact?intent=demo"
        secondaryLabel="Book a platform demo"
      />

      <section className="px-6 pb-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <TrustBar />
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
                Platform subscription
              </p>
              <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
                Start · Grow · Scale · Enterprise
              </h2>
              <p className="mt-3 max-w-3xl text-muted-foreground">{PRICING_NOTES.availabilityNote}</p>
            </div>
            <div className="max-w-md text-sm leading-6 text-muted-foreground lg:text-right">
              <p>{COMMERCIAL_CONFIG.taxNote}</p>
              <p>{COMMERCIAL_CONFIG.annualNote}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {PRICING_PLANS.map((plan) => {
              const price = priceLabel(plan);
              return (
                <article
                  key={plan.id}
                  className={`flex flex-col border p-6 ${
                    plan.featured
                      ? "border-rinads-primary/50 bg-rinads-primary/5"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    {plan.featured ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-rinads-primary">
                        Most popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-5 text-2xl font-black text-foreground">{price.primary}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{price.secondary}</p>
                  <p className="mt-4 text-xs text-muted-foreground">For: {plan.targetCustomer}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                    <li>Users: {plan.includedUsers}</li>
                    <li>RINPO / RI: {plan.includedAiAllowance}</li>
                    <li>Automation: {plan.includedAutomationAllowance}</li>
                    <li>Integrations: {plan.integrations}</li>
                    <li>Support: {plan.supportLevel}</li>
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {plan.includedOperatingSystems.map((os) => (
                      <span
                        key={os}
                        className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {os}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={plan.cta.href}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
                    onClick={() => trackMarketing("pricing_plan_selected", { plan: plan.id })}
                  >
                    {plan.cta.label}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing-estimator" className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20 scroll-mt-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
            Configure your commercial stack
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">Build an indicative RINADS estimate</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Combine platform, industry, commerce, RI usage, implementation and managed growth. The result is a commercial starting point; final proposals follow discovery and readiness validation.
          </p>
          <div className="mt-10">
            <PricingEstimator />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">Industry editions</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">One core, configured for how your industry works</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Industry pricing reflects workflow depth and operating complexity. These ranges are starting commercial bands; product readiness still governs what can be sold as production software.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INDUSTRY_PACKS.map((item) => <CommercialCard key={item.id} item={item} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">Shopify + RINADS</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">Commerce engine below. Operating intelligence above.</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Merchants normally own and pay Shopify directly. RINADS prices the implementation, operating integration, RINPO experience, automation and intelligence layer separately.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SHOPIFY_PACKAGES.map((item) => <CommercialCard key={item.id} item={item} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">Expansion layers</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">Add capability without hiding service cost inside SaaS</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">{PRICING_NOTES.rinpoNote}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SERVICE_LAYERS.map((item) => <CommercialCard key={item.id} item={item} />)}
          </div>
          <p className="mt-6 max-w-4xl text-xs leading-5 text-muted-foreground">{PRICING_NOTES.thirdPartyNote}</p>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Compare platform coverage</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Self-qualify against seats, operating systems, RINPO / RI allowance and implementation depth.
          </p>
          <div className="mt-8">
            <PricingComparison />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
            Implementation services
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
            Recurring software and one-time transformation stay separate
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{PRICING_NOTES.softwareVsServices}</p>
          <Link
            href="/contact?intent=implementation"
            className="mt-8 inline-flex min-h-11 items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50"
          >
            Scope an implementation
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Operating system availability</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Readiness status remains authoritative. A commercial price does not turn a prototype into production software.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OS_AVAILABILITY.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="flex items-start justify-between gap-3 border border-white/10 p-4 transition hover:border-rinads-primary/40"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{item.commercialPriority} priority</p>
                </div>
                <ProductStatus status={item.status} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <FAQAccordion items={PRICING_FAQ} />
        </div>
      </section>

      <CTASection
        headline="Configure the RINADS stack your business actually needs."
        summary="Start with platform coverage, then add industry depth, RI usage and implementation without mixing third-party costs into the software price."
        primaryHref="#pricing-estimator"
        primaryLabel="Build my estimate"
        onPrimaryClick={() => trackMarketing("pricing_estimate_started", { source: "pricing_cta" })}
      />
    </MarketingPageShell>
  );
}
