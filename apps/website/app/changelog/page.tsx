import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/changelog") as Metadata) ?? { title: "Changelog | RINADS" };
}

export default function ChangelogPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Changelog"
        headline="Product updates, published when ready."
        summary="This page will list meaningful platform changes. We do not invent release notes or backdated fake shipping history."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-foreground">No entries published yet</h2>
          <p className="mt-3 text-muted-foreground">
            When we publish changelog entries, they will describe real, customer-relevant changes with
            honest availability notes. Until then, ask the team about recent work during a demo.
          </p>
          <Link
            href="/contact?intent=demo"
            className="mt-6 inline-flex text-sm font-semibold text-rinads-primary hover:underline"
          >
            Book a platform demo →
          </Link>
        </div>
      </section>
    </MarketingPageShell>
  );
}
