import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero, CTASection } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (
    (metadataFromRegistry("/company/rinpo-story") as Metadata) ?? { title: "RINPO Story | RINADS" }
  );
}

export default function CompanyRinpoStoryPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Company · Narrative"
        headline="RINPO is the interface. RINADS is the operating layer."
        summary="This page holds the company narrative for RINPO. Product capabilities, demos, and channel experiences live on the product page."
        primaryHref="/rinpo"
        primaryLabel="See how RINPO works"
        secondaryHref="/contact?intent=demo"
        secondaryLabel="Book a platform demo"
      />

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground">
          <p>
            RINPO exists so people can ask what needs attention, understand business context, draft the next
            step, and move supported work forward — with permissions and human approval where it matters.
          </p>
          <p>
            The narrative is simple: businesses should not need a different AI for every disconnected tool.
            They need an interface that operates inside the same operating systems that run customers, work,
            commerce, marketing, and automation.
          </p>
          <p>
            For product direction, demos, voice, and intelligence surfaces, go to{" "}
            <Link href="/rinpo" className="font-semibold text-rinads-primary hover:underline">
              /rinpo
            </Link>
            . This company page is the story pointer — not a substitute for the product.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm font-semibold text-rinads-primary">
            <Link href="/rinpo">RINPO product →</Link>
            <Link href="/platform/rinads-intelligence">RINADS Intelligence →</Link>
            <Link href="/about">About RINADS →</Link>
          </div>
        </div>
      </section>

      <CTASection
        headline="Meet RINPO inside the platform."
        summary="Explore the product, or book a demo to see how governed assistance fits your workflows."
      />
    </MarketingPageShell>
  );
}
