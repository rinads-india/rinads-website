import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero, CTASection } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { CTAS } from "@/lib/ctas";

const PATH = "/company/story";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Story | RINADS" };
}

export default function CompanyStoryPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Company", path: "/company" },
          { name: "Story", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Company"
          headline="Building the operating layer for modern businesses."
          summary="RINADS connects customers, work, commerce, growth, and automation on one foundation — with RINPO as the governed AI interface and implementation services when configuration is required."
          primaryHref={CTAS.bookDemo.href}
          primaryLabel={CTAS.bookDemo.label}
          secondaryHref="/platform"
          secondaryLabel="Explore platform"
        />
        <section className="px-6 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl space-y-4 text-muted-foreground">
            <p>
              Growing businesses do not need another disconnected app. They need shared organisation context
              so people and assistants can act inside the same permissions, approvals, and audit expectations.
            </p>
            <p>
              We publish availability labels and security statements tied to implemented posture — not marketing
              theatre. Customer stories appear only when verified evidence exists.
            </p>
            <Link href="/company/rinpo-story" className="inline-flex text-sm font-semibold text-rinads-primary hover:underline">
              Read the RINPO narrative →
            </Link>
          </div>
        </section>
        <CTASection headline="Start from your operating reality." summary="Book a demo or talk through implementation when you are ready." />
      </MarketingPageShell>
    </>
  );
}
