"use client";

import {
  MarketingPageShell,
  PageHero,
  IntelligencePanel,
  CTASection,
} from "@/components/system";
import { INTELLIGENCE_CAPABILITIES } from "@/lib/content/services";
import Link from "next/link";

export function RinpoIntelligenceClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINPO · Intelligence"
        headline="RINPO connects you to the brain."
        summary="RINPO is the interface to RINADS Intelligence — the layer that understands your business and helps you decide what to do next."
        primaryHref="/platform/rinads-intelligence"
        primaryLabel="RINADS Intelligence"
        secondaryHref="/rinpo"
        secondaryLabel="Back to RINPO"
      />
      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <IntelligencePanel
            title="What RINADS Intelligence does"
            description="How understanding becomes action across the operating platform."
            items={[...INTELLIGENCE_CAPABILITIES]}
          />
          <p className="mt-8 text-sm text-muted-foreground">
            Deep dive:{" "}
            <Link href="/platform/rinads-intelligence" className="text-rinads-primary hover:underline">
              RINADS Intelligence platform page
            </Link>
          </p>
        </div>
      </section>
      <CTASection headline="Ask RINPO for direction." />
    </MarketingPageShell>
  );
}
