import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { CustomerEvidence, caseStudyToEvidence } from "@/components/system/CustomerEvidence";
import {
  CUSTOMER_EVIDENCE_SECTIONS,
  EVIDENCE_EMPTY_STATES,
  getPublishedCaseStudiesByClass,
} from "@/lib/content/case-studies";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/customers") as Metadata) ?? { title: "Customers | RINADS" };
}

/** In-page evidence anchors: #stories, #deployments, #demonstrations, #labs */
export default function CustomersPage() {
  return (
    <>
      <CommercialJsonLd
        path="/customers"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Customers", path: "/customers" },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Customers"
          headline="Customer evidence — verified only."
          summary="Stories, deployments, demonstrations, and labs content appear here only after review and approval. We do not invent logos, metrics, or testimonials."
          primaryHref="/contact?intent=demo"
          primaryLabel="Book a demo"
        />

        <div className="space-y-24 px-6 pb-24 md:px-12 lg:px-20">
          {CUSTOMER_EVIDENCE_SECTIONS.map((section) => {
            const studies = getPublishedCaseStudiesByClass(section.id);
            const empty = EVIDENCE_EMPTY_STATES[section.id];

            return (
              <section
                key={section.id}
                id={section.id}
                className="mx-auto max-w-7xl scroll-mt-28"
                aria-labelledby={`${section.id}-heading`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
                  {section.heading}
                </p>
                <h2 id={`${section.id}-heading`} className="mt-3 text-2xl font-bold text-foreground md:text-3xl">
                  {section.heading}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{section.summary}</p>

                {studies.length === 0 ? (
                  <div className="mt-8 border border-white/10 p-8 md:p-12">
                    <h3 className="text-xl font-bold text-foreground">{empty.title}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{empty.body}</p>
                    {empty.ctaHref && empty.ctaLabel ? (
                      <Link
                        href={empty.ctaHref}
                        className="mt-8 inline-flex rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
                      >
                        {empty.ctaLabel}
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {studies.map((study) => (
                      <CustomerEvidence
                        key={study.slug}
                        data={caseStudyToEvidence(study)}
                        href={`/customers/${study.slug}`}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </MarketingPageShell>
    </>
  );
}
