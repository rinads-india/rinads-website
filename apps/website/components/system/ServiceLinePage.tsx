"use client";

import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
} from "@/components/system";
import type { ServiceLine } from "@/lib/content/types";
import Link from "next/link";

export function ServiceLinePage({ service }: { service: ServiceLine }) {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={`Services · ${service.verb}`}
        headline={service.headline}
        summary={service.summary}
        primaryHref="/projects"
        primaryLabel="Start a project"
        secondaryHref="/services"
        secondaryLabel="All services"
      />
      <ModuleGrid title="Offerings" modules={service.offerings.map((o) => ({ name: o }))} />
      <section className="px-6 pb-8 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <Link href="/platform" className="text-sm font-semibold text-rinads-primary hover:underline">
            See the platform these services run on →
          </Link>
        </div>
      </section>
      <CTASection headline={`${service.verb} with RINADS.`} />
    </MarketingPageShell>
  );
}
