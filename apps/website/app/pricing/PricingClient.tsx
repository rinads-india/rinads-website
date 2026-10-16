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
  OS_AVAILABILITY,
  PRICE_APPROVED,
  PRICING_FAQ,
  PRICING_NOTES,
  PRICING_PLANS,
  type PricingPlan,
} from "@/lib/content/commercialConfig";
import { trackMarketing } from "@/lib/analytics";

function priceLabel(plan: PricingPlan): { primary: string; secondary: string } {
  if (PRICE_APPROVED && typeof plan.monthlyPrice === "number") {
    return {
      primary: `Starting at ₹${plan.monthlyPrice.toLocaleString("en-IN")}/month`,
      secondary:
        typeof plan.annualPrice === "number"
          ? `₹${plan.annualPrice.toLocaleString("en-IN")} annually`
          : "Annual options available",
    };
  }
  return {
    primary: COMMERCIAL_CONFIG.configuredPricingLabel,
    secondary: COMMERCIAL_CONFIG.configuredPricingExplanation,
  };
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
        summary="Plans describe operating coverage. Public numeric rates appear only after commercial approval — until then, request a configured estimate."
        primaryHref={COMMERCIAL_CONFIG.estimateCta.href}
        primaryLabel={COMMERCIAL_CONFIG.estimateCta.label}
        secondaryHref="/contact?intent=demo"
        secondaryLabel="Book a demo"
      />

      <section className="px-6 pb-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <TrustBar />
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
            Software subscription
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
            Start · Grow · Scale · Enterprise
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{PRICING_NOTES.availabilityNote}</p>

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
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-5 text-2xl font-black text-foreground">{price.primary}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{price.secondary}</p>
                  <p className="mt-4 text-xs text-muted-foreground">For: {plan.targetCustomer}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                    <li>Users: {plan.includedUsers}</li>
                    <li>AI / RINPO: {plan.includedAiAllowance}</li>
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
                    onClick={() =>
                      trackMarketing("pricing_plan_selected", { plan: plan.id })
                    }
                  >
                    {plan.cta.label}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Compare coverage</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Self-qualify against seats, operating systems, AI allowance, and implementation depth.
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
            Separately scoped when migration or custom work is required
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{PRICING_NOTES.softwareVsServices}</p>
          <Link
            href="/contact?intent=implementation"
            className="mt-8 inline-flex min-h-11 items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50"
          >
            Talk to an implementation specialist
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Operating system availability</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Status labels describe readiness honestly — not marketing gloss.
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
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {item.commercialPriority} priority
                  </p>
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
        headline="Get a pricing estimate for your operating coverage."
        summary="Tell us your team size and systems — we configure pricing transparently."
        primaryHref={COMMERCIAL_CONFIG.estimateCta.href}
        primaryLabel={COMMERCIAL_CONFIG.estimateCta.label}
        onPrimaryClick={() => trackMarketing("pricing_estimate_started", { source: "pricing_cta" })}
      />
    </MarketingPageShell>
  );
}
