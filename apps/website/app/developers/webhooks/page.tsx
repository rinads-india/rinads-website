import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/developers/webhooks") as Metadata) ?? { title: "Webhooks | RINADS" };
}

export default function DevelopersWebhooksPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Developers · Webhooks"
        headline="Webhooks for supported platform events."
        summary="Webhook delivery is documented when the event contract, signing model, and retry behaviour are stable enough to integrate against."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground">
          <p>
            Planned direction: notify your systems when supported business events occur, with verification
            and idempotent handling guidance.
          </p>
          <p>
            Endpoint URLs, signature headers, and sample payloads are omitted until they represent a real,
            supported contract — not a marketing sketch.
          </p>
          <p className="text-sm">
            <Link href="/developers/events" className="font-semibold text-rinads-primary hover:underline">
              Related: Events →
            </Link>
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
