import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/developers") as Metadata) ?? { title: "Developers | RINADS" };
}

const SECTIONS = [
  {
    href: "/developers/authentication",
    label: "Authentication",
    description: "How applications authenticate to RINADS developer interfaces.",
  },
  {
    href: "/developers/api",
    label: "API",
    description: "API reference for integrations that are contractually stable.",
  },
  {
    href: "/developers/webhooks",
    label: "Webhooks",
    description: "Webhook delivery model for supported platform events.",
  },
  {
    href: "/developers/events",
    label: "Events",
    description: "Event types used across governed workflows and integrations.",
  },
] as const;

export default function DevelopersPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Developers"
        headline="Build on stable RINADS interfaces."
        summary="Developer documentation covers foundation concepts only. Endpoints, payloads, and behaviours appear here only when they are stable enough to integrate against."
        primaryHref="/contact?intent=implementation"
        primaryLabel="Talk about integration"
        secondaryHref="/docs"
        secondaryLabel="Docs hub"
      />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200">
            Only stable interfaces are documented. This site does not publish inventable or draft API
            catalogues. If an interface is missing here, treat it as unavailable for public integration until published.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="border border-white/10 p-6 transition hover:border-rinads-primary/40"
              >
                <h2 className="text-xl font-bold text-foreground">{section.label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
