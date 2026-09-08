"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  ServiceCard,
  CTASection,
} from "@/components/system";
import { SERVICE_LINES } from "@/lib/content/services";
import type { ServiceCatalogItem } from "@/lib/services/types";
import { formatServicePrice } from "@/lib/services/types";

type Props = {
  catalog: ServiceCatalogItem[];
};

export function ServicesClient({ catalog }: Props) {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINADS Services"
        headline="Build. Grow. Automate. Create. Transform. Train."
        summary="Human delivery capability on top of the AI Operating Platform — ship software, grow brands, automate operations, create media, transform businesses, and train people."
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/projects"
        secondaryLabel="Start a project"
      />

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LINES.map((s) => (
              <ServiceCard
                key={s.slug}
                name={s.name}
                verb={s.verb}
                summary={s.summary}
                href={`/services/${s.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      {catalog.length > 0 ? (
        <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-foreground">Service catalog</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="border border-white/10 p-5 transition hover:border-rinads-primary/40"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-rinads-primary">{item.pillar}</p>
                  <h3 className="mt-2 font-bold text-foreground">{item.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-3 text-sm text-white/70">{formatServicePrice(item)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CTASection
        headline="Work with RINADS Services."
        summary="Talk to RINPO about what you need to build, grow, automate, create, transform, or train."
      />
    </MarketingPageShell>
  );
}
