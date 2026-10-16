import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero, AvailabilityBadge } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { PRODUCT_STATUS_META, PRODUCT_STATUS_VALUES } from "@/lib/product-status";
import { metadataFromRegistry } from "@/lib/route-registry";
import { CTAS } from "@/lib/ctas";

const PATH = "/trust/availability";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Availability | RINADS" };
}

export default function TrustAvailabilityPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Trust", path: "/trust" },
          { name: "Availability", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Availability"
          headline="Four public readiness states — no softer language."
          summary="RINADS uses exactly four labels across platform pillars, editions, and integrations. They describe what you can rely on today, not roadmap optimism."
          primaryHref={CTAS.bookDemo.href}
          primaryLabel={CTAS.bookDemo.label}
          secondaryHref="/platform"
          secondaryLabel="Explore platform"
        />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl space-y-6">
            {PRODUCT_STATUS_VALUES.map((status) => {
              const meta = PRODUCT_STATUS_META[status];
              return (
                <article
                  key={status}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{meta.label}</h2>
                    <AvailabilityBadge status={status} showDescription={false} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{meta.description}</p>
                </article>
              );
            })}
            <p className="text-sm text-muted-foreground">
              Labels on marketing pages are sourced from the product catalog and integration registry. If a
              surface is missing a badge, treat it as informational only.{" "}
              <Link href="/trust" className="font-semibold text-rinads-primary hover:underline">
                Back to Trust
              </Link>
            </p>
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
