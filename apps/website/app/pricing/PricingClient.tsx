"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  ProductStatus,
  CTASection,
} from "@/components/system";
import {
  OS_AVAILABILITY,
  PRICING_NOTES,
  PRICING_PLANS,
  type PricingPlan,
} from "@/lib/content/pricing";

function priceLabel(value: PricingPlan["monthlyPrice"]): string {
  if (value === "coming_soon") return "Coming soon";
  if (value === "contact") return "Contact sales";
  return "Contact sales";
}

export function PricingClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Pricing"
        headline="Software subscription, with implementation when you need it."
        summary="Plans describe packaging architecture. Public numeric rates appear only after commercial approval — until then, talk to sales."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/contact?intent=sales"
        secondaryLabel="Talk to sales"
      />

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
            Software subscription
          </p>
          <h2 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
            Choose the operating coverage that fits your team
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{PRICING_NOTES.availabilityNote}</p>

          <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {PRICING_PLANS.map((plan) => (
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
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rinads-primary">
                      Popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-5 text-2xl font-black text-foreground">{priceLabel(plan.monthlyPrice)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.monthlyPrice === "contact" || plan.monthlyPrice === "coming_soon"
                    ? "Public numeric rates appear after commercial approval"
                    : `Monthly · ${priceLabel(plan.annualPrice)} annually`}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">For: {plan.targetCustomer}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                  <li>Users: {plan.includedUsers}</li>
                  <li>AI: {plan.includedAiAllowance}</li>
                  <li>Automation: {plan.includedAutomationAllowance}</li>
                  <li>Integrations: {plan.integrations}</li>
                  <li>Support: {plan.supportLevel}</li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {plan.includedOperatingSystems.map((os) => (
                    <span key={os} className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {os}
                    </span>
                  ))}
                </div>
                <Link
                  href={plan.cta.href}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
                >
                  {plan.cta.label}
                </Link>
              </article>
            ))}
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
            className="mt-8 inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50"
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
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{item.commercialPriority} priority</p>
                </div>
                <ProductStatus status={item.status} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Ready to map the right plan?"
        summary="Book a demo or talk to sales — we will not invent prices on this page."
      />
    </MarketingPageShell>
  );
}
