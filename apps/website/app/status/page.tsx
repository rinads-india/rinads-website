import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/status") as Metadata) ?? { title: "Status | RINADS" };
}

export default function StatusPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Status"
        headline="Service status for public surfaces."
        summary="Status claims are only published when backed by monitoring. This page does not invent uptime percentages, SLAs, or “all systems operational” theatre."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200">
            No public uptime SLA or historical availability metric is claimed here. If you need operational
            detail for a deployment conversation, contact the team.
          </div>
          <div className="border border-white/10 p-8">
            <h2 className="text-xl font-bold text-foreground">Monitoring-backed status coming later</h2>
            <p className="mt-3 text-muted-foreground">
              When a monitored status board is ready, component health will appear here without fabricated
              percentages. Until then, treat this page as an honest stub.
            </p>
            <Link
              href="/contact?intent=security"
              className="mt-6 inline-flex text-sm font-semibold text-rinads-primary hover:underline"
            >
              Contact about reliability →
            </Link>
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
