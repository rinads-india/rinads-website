import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingPageShell } from "@/components/system";
import { findGrowthGuide, GROWTH_GUIDES } from "@/lib/content/growth-knowledge";

type Props = { params: Promise<{ slug: string }> };
const ORIGIN = "https://www.rinads.com";

export function generateStaticParams() {
  return GROWTH_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGrowthGuide(slug);
  if (!guide) return { title: "Guide not found | RINADS", robots: { index: false } };
  const canonical = `${ORIGIN}/resources/growth-library/${guide.slug}`;
  return {
    title: `${guide.title} | RI GROWTH Knowledge — RINADS`,
    description: guide.description,
    alternates: { canonical },
    openGraph: { type: "article", title: guide.title, description: guide.description, url: canonical },
  };
}

export default async function GrowthArticlePage({ params }: Props) {
  const { slug } = await params;
  const guide = findGrowthGuide(slug);
  if (!guide) notFound();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "en-IN",
    mainEntityOfPage: `${ORIGIN}/resources/growth-library/${guide.slug}`,
    author: { "@type": "Organization", name: "RINADS TECHNOLOGIES" },
    publisher: { "@type": "Organization", name: "RINADS TECHNOLOGIES", url: ORIGIN },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }} />
      <MarketingPageShell>
        <main className="px-6 pb-24 pt-16 md:px-12 lg:px-20">
          <article className="mx-auto max-w-3xl">
            <Link href="/resources/growth-library" className="inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All growth guides
            </Link>
            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.19em] text-rinads-primary">{guide.category} · {guide.readMinutes} min read</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">{guide.title}</h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">{guide.description}</p>
            <p className="mt-4 text-xs text-muted-foreground">Educational material by RINADS TECHNOLOGIES · Not a substitute for property-specific analytics or a ranking guarantee</p>
            <div className="mt-12 space-y-12 border-t border-[var(--border)] pt-10">
              {guide.sections.map((section) => (
                <section key={section.heading} aria-labelledby={`section-${guide.slug}-${guide.sections.indexOf(section)}`}>
                  <h2 id={`section-${guide.slug}-${guide.sections.indexOf(section)}`} className="text-2xl font-bold text-foreground">{section.heading}</h2>
                  <div className="mt-5 space-y-5">
                    {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-muted-foreground">{paragraph}</p>)}
                  </div>
                  {section.actions && (
                    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                      <h3 className="text-sm font-bold text-foreground">Practical next steps</h3>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
                        {section.actions.map((action) => <li key={action}>{action}</li>)}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
            </div>
            <div className="mt-14 rounded-2xl border border-rinads-primary/30 bg-rinads-primary/5 p-7">
              <h2 className="text-xl font-bold text-foreground">Want an evidence-based review of your own website?</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Request a human-reviewed pilot audit. Connected property data and changes require appropriate authorization.</p>
              <Link href="/contact?intent=audit&source=ri-growth-library" className="mt-5 inline-flex items-center gap-2 font-semibold text-rinads-primary hover:underline">
                Request an audit <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </main>
      </MarketingPageShell>
    </>
  );
}
