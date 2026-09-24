import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/careers") as Metadata) ?? { title: "Careers | RINADS" };
}

export default function CareersPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Careers"
        headline="Build the operating layer with us."
        summary="We publish open roles only when they are real. This page does not invent job listings, fake headcount, or urgency theatre."
        primaryHref="/contact"
        primaryLabel="Contact the team"
        secondaryHref="/about"
        secondaryLabel="About RINADS"
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-foreground">No open roles published</h2>
          <p className="mt-3 text-muted-foreground">
            There are no invented openings on this page. When roles open, they will appear here with clear
            expectations. In the meantime, you can introduce yourself through contact.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            Introduce yourself
          </Link>
        </div>
      </section>
    </MarketingPageShell>
  );
}
