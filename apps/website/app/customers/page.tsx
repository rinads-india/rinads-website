import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { getPublishedCaseStudies } from "@/lib/content/case-studies";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/customers") as Metadata) ?? { title: "Customers | RINADS" };
}

export default function CustomersPage() {
  const studies = getPublishedCaseStudies();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Customers"
        headline="How organisations run on RINADS."
        summary="Published stories appear here only after customer approval. We do not invent logos, metrics, or testimonials."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
      />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {studies.length === 0 ? (
            <div className="border border-white/10 p-8 md:p-12">
              <h2 className="text-2xl font-bold text-foreground">Customer stories coming soon</h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                We have not published approved case studies yet. When organisations approve their stories —
                including verified results — they will appear here. Until then, talk with us about your
                workflow and we will share only what we can stand behind.
              </p>
              <Link
                href="/contact?intent=sales"
                className="mt-8 inline-flex rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
              >
                Talk to sales
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {studies.map((study) => (
                <Link
                  key={study.slug}
                  href={`/customers/${study.slug}`}
                  className="border border-white/10 p-6 transition hover:border-rinads-primary/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
                    {study.industry}
                  </p>
                  <h2 className="mt-3 text-xl font-bold text-foreground">{study.customerName}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{study.problem}</p>
                  <p className="mt-4 text-sm font-semibold text-rinads-primary">Read story →</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingPageShell>
  );
}
