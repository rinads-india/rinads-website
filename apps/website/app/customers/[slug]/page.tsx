import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell, PageHero } from "@/components/system";
import { getCaseStudy, getPublishedCaseStudies } from "@/lib/content/case-studies";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) {
    return { title: "Customer story | RINADS", robots: { index: false, follow: false } };
  }
  return {
    title: `${study.customerName} | Customers | RINADS`,
    description: study.problem,
  };
}

export default async function CustomerStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={`${study.industry} · ${study.location}`}
        headline={study.customerName}
        summary={study.problem}
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/customers"
        secondaryLabel="All customers"
      />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-3xl gap-10">
          <Block title="Previous workflow" body={study.previousWorkflow} />
          <Block title="RINADS solution" body={study.rinadsSolution} />
          <Block title="Implementation scope" body={study.implementationScope} />
          <Block title="Timeline" body={study.timeline} />
          <Block title="Results" body={study.results} />

          {study.operatingSystems.length ? (
            <div>
              <h2 className="text-xl font-bold text-foreground">Operating systems</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {study.operatingSystems.map((os) => (
                  <li key={os} className="border border-white/10 px-3 py-1 text-sm text-muted-foreground">
                    {os}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {study.integrations.length ? (
            <div>
              <h2 className="text-xl font-bold text-foreground">Integrations</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {study.integrations.map((item) => (
                  <li key={item} className="border border-white/10 px-3 py-1 text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {study.verifiedMetrics.length ? (
            <div>
              <h2 className="text-xl font-bold text-foreground">Verified metrics</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {study.verifiedMetrics.map((metric) => (
                  <div key={metric.label} className="border border-white/10 p-4">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</dt>
                    <dd className="mt-2 text-2xl font-bold text-foreground">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {study.quote ? (
            <blockquote className="border-l-2 border-rinads-primary pl-5">
              <p className="text-lg text-foreground">&ldquo;{study.quote.text}&rdquo;</p>
              <footer className="mt-3 text-sm text-muted-foreground">{study.quote.attribution}</footer>
            </blockquote>
          ) : null}

          {study.productStatusNote ? (
            <p className="text-sm text-muted-foreground">{study.productStatusNote}</p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            Want a similar conversation for your organisation?{" "}
            <Link href="/contact?intent=sales" className="font-semibold text-rinads-primary hover:underline">
              Talk to sales
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-3 text-muted-foreground">{body}</p>
    </div>
  );
}
