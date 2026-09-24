import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero, ProductStatus } from "@/components/system";
import {
  INTEGRATIONS,
  type IntegrationStatus,
} from "@/lib/content/case-studies";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/integrations") as Metadata) ?? { title: "Integrations | RINADS" };
}

const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  live: "Live",
  beta: "Beta",
  private_preview: "Private preview",
  planned: "Planned",
};

const INTEGRATION_STATUS_CLASS: Record<IntegrationStatus, string> = {
  live: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  beta: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  private_preview: "border-amber-500/35 bg-amber-500/10 text-amber-200",
  planned: "border-white/15 bg-transparent text-white/45",
};

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Integrations"
        headline="Connect the tools your business already uses."
        summary="Every integration declares live, beta, private preview, or planned status. We do not invent partner logos or claim availability we cannot deliver."
        primaryHref="/contact?intent=implementation"
        primaryLabel="Talk about integrations"
        secondaryHref="/developers"
        secondaryLabel="Developer docs"
      />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className="border border-white/10 p-6 transition hover:border-rinads-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.category}</p>
                  <h2 className="mt-2 text-xl font-bold text-foreground">{item.name}</h2>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${INTEGRATION_STATUS_CLASS[item.status]}`}
                >
                  {INTEGRATION_STATUS_LABEL[item.status]}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.summary}</p>
              <div className="mt-4">
                <ProductStatus status={item.productStatus} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingPageShell>
  );
}
