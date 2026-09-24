import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/developers/events") as Metadata) ?? { title: "Events | RINADS" };
}

export default function DevelopersEventsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Developers · Events"
        headline="Events that keep work traceable."
        summary="Event primitives exist so important system activity can remain attributable. Public event catalogues are published only when names and payloads are stable."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground">
          <p>
            Foundation principle: meaningful actions — especially those involving AI assistance or
            approvals — should leave an auditable trail inside organisation context.
          </p>
          <p>
            A full event type list is not invented here. When event contracts are ready for integration,
            they will be listed with versioning and webhook delivery notes.
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
