import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero, CTASection } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/about") as Metadata) ?? { title: "About RINADS" };
}

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="About"
        headline="Building the operating layer for modern businesses."
        summary="Most teams run on fragmented CRM, commerce, project, marketing, and automation tools. RINADS connects those workflows on one foundation — with RINPO as the governed AI interface."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/platform"
        secondaryLabel="Explore the platform"
      />

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">The thesis</h2>
          <p className="mt-4 text-muted-foreground">
            Growing businesses do not need another disconnected app. They need an operating layer where
            customers, work, money, growth, and automation share context — so people and AI assistants can
            act inside the same controls.
          </p>
          <p className="mt-4 text-muted-foreground">
            RINADS is that layer: connected operating systems on a shared cloud foundation, with
            implementation services when configuration or migration is required.
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Founders & team</h2>
          <p className="mt-4 text-muted-foreground">
            RINADS is built by a product and delivery team focused on practical business operations — not
            vapourware claims. We publish availability labels, security control status, and legal materials
            only when they are accurate.
          </p>
          <p className="mt-4 text-muted-foreground">
            We do not invent headcount, funding rounds, customer counts, or compliance certifications for
            marketing effect.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-rinads-primary">
            <Link href="/company">Company →</Link>
            <Link href="/careers">Careers →</Link>
            <Link href="/contact">Contact →</Link>
            <Link href="/company/rinpo-story">RINPO narrative →</Link>
          </div>
        </div>
      </section>

      <CTASection
        headline="Talk with the team building the operating layer."
        summary="Book a demo or start a project conversation — we will meet you where your operations are today."
      />
    </MarketingPageShell>
  );
}
