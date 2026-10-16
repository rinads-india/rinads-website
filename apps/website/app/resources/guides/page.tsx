import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { CTAS } from "@/lib/ctas";

const PATH = "/resources/guides";

const GUIDES = [
  {
    title: "Business Readiness Assessment",
    href: "/business-readiness",
    description: "Interactive orientation — not a certification.",
  },
  {
    title: "Availability labels",
    href: "/trust/availability",
    description: "What Available, Pilot, Preview, and Roadmap mean on this site.",
  },
  {
    title: "Platform overview",
    href: "/platform",
    description: "How Business, Commerce, Growth, Automation, Intelligence, Runtime, and Cloud connect.",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Guides | RINADS" };
}

export default function ResourcesGuidesPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Guides", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Guides"
          headline="Practical operating guides as we publish them."
          summary="We link only to material that exists today. No fabricated playbooks or unverified ROI claims."
          primaryHref={CTAS.businessReadiness.href}
          primaryLabel={CTAS.businessReadiness.label}
          secondaryHref="/resources"
          secondaryLabel="Resources hub"
        />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl space-y-4">
            {GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-rinads-primary/40"
              >
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{guide.title}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{guide.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
