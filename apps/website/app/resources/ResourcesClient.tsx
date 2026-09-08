"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  CTASection,
} from "@/components/system";

const LINKS = [
  { label: "Platform architecture", href: "/platform", description: "Experience → RINPO → Runtime → Intelligence → OS → Services → Cloud." },
  { label: "RINADS Intelligence", href: "/platform/rinads-intelligence", description: "Business graph, memory, decisions, agents, and audit." },
  { label: "RINADS Cloud", href: "/platform/rinads-cloud", description: "Data, AI, APIs, integrations, security, infrastructure." },
  { label: "RINPO", href: "/rinpo", description: "The persistent AI interface for business." },
  { label: "Academy", href: "/academy", description: "Real Experience Academy model and programs." },
  { label: "Start a project", href: "/projects", description: "Tell us what you want to build, grow, or transform." },
];

export function ResourcesClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Resources"
        headline="Understand the operating platform."
        summary="Architecture explainers, product guides, and paths into RINADS — the front door to RUN, BUILD, GROW, LEARN, and AUTOMATE."
      />
      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-white/10 p-6 transition hover:border-rinads-primary/40"
            >
              <h3 className="text-lg font-bold text-foreground">{link.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <CTASection headline="Ready to enter the platform?" />
    </MarketingPageShell>
  );
}
