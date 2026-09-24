import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell, PageHero, ProductStatus } from "@/components/system";
import {
  getIntegration,
  INTEGRATIONS,
  type IntegrationStatus,
} from "@/lib/content/case-studies";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  live: "Live",
  beta: "Beta",
  private_preview: "Private preview",
  planned: "Planned",
};

export function generateStaticParams() {
  return INTEGRATIONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getIntegration(slug);
  if (!item) {
    return { title: "Integration | RINADS", robots: { index: false, follow: false } };
  }
  return {
    title: `${item.name} Integration | RINADS`,
    description: item.summary,
  };
}

export default async function IntegrationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getIntegration(slug);
  if (!item) notFound();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={`${item.category} · ${INTEGRATION_STATUS_LABEL[item.status]}`}
        headline={`${item.name} on RINADS`}
        summary={item.summary}
        primaryHref="/contact?intent=implementation"
        primaryLabel="Talk about this integration"
        secondaryHref="/integrations"
        secondaryLabel="All integrations"
      />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">Availability</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {INTEGRATION_STATUS_LABEL[item.status]}
              </span>
              <ProductStatus status={item.productStatus} showDescription />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">What this means for buyers</h2>
            <p className="mt-3 text-muted-foreground">
              Integration readiness depends on organisation configuration, credentials, and — for private
              preview or planned items — explicit enablement. We document only capabilities we can stand
              behind for your deployment conversation.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Need something else connected?{" "}
            <Link href="/contact?intent=implementation" className="font-semibold text-rinads-primary hover:underline">
              Talk to an implementation specialist
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
