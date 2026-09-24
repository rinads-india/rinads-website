import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/developers/api") as Metadata) ?? { title: "API Reference | RINADS" };
}

export default function DevelopersApiPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Developers · API"
        headline="API reference — foundation only."
        summary="Public API surface area is published when contracts are stable. This page intentionally does not invent endpoints, request bodies, or response schemas."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground">
          <p>
            When stable APIs are ready for partner or customer integration, they will be listed here with
            authentication requirements, resource models, and error conventions.
          </p>
          <p>
            Until then, treat unpublished paths as unsupported. Prefer talking with implementation about
            your integration goals rather than reverse-engineering app surfaces.
          </p>
          <p className="text-sm">
            <Link href="/developers" className="font-semibold text-rinads-primary hover:underline">
              ← Developers hub
            </Link>
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
