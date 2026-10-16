import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { USE_CASES } from "@/lib/content/use-cases";
import { metadataFromRegistry } from "@/lib/route-registry";
import { CTAS } from "@/lib/ctas";

const PATH = "/use-cases";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Use Cases | RINADS" };
}

export default function UseCasesHubPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Use cases", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Solutions"
          headline="Start from the problem you need to solve."
          summary="High-intent outcomes on the RINADS platform — each page links to the relevant pillar without inventing separate products or customer proof."
          primaryHref={CTAS.bookDemo.href}
          primaryLabel={CTAS.bookDemo.label}
          secondaryHref="/solutions"
          secondaryLabel="Industry editions"
        />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2">
            {USE_CASES.map((item) => (
              <Link
                key={item.slug}
                href={`/use-cases/${item.slug}`}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-rinads-primary/40"
              >
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
