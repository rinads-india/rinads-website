import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { CTASection } from "@/components/system/CTASection";
import { MarketingPageShell } from "@/components/system/MarketingPageShell";
import { PageHero } from "@/components/system/PageHero";
import { CTAS } from "@/lib/ctas";

export type UseCaseStubPageProps = {
  slug: string;
  title: string;
  summary: string;
  outcomes: string[];
  platformHref: string;
  platformLabel: string;
};

export function UseCaseStubPage({
  slug,
  title,
  summary,
  outcomes,
  platformHref,
  platformLabel,
}: UseCaseStubPageProps) {
  const path = `/use-cases/${slug}`;
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Use cases", path: "/use-cases" },
    { name: title, path },
  ];

  return (
    <>
      <CommercialJsonLd path={path} breadcrumbs={breadcrumbs} />
      <MarketingPageShell breadcrumbs={breadcrumbs}>
        <PageHero
          eyebrow="Use case"
          headline={title}
          summary={summary}
          primaryHref={CTAS.bookDemo.href}
          primaryLabel={CTAS.bookDemo.label}
          secondaryHref={platformHref}
          secondaryLabel={platformLabel}
          compactTop
        />
        <section className="px-6 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200">
              This page describes a common operating outcome on RINADS. It does not claim a separate product
              SKU or invented customer proof.
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {outcomes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-rinads-primary" aria-hidden>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/use-cases"
              className="inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
            >
              All use cases
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </section>
        <CTASection headline="Start from your outcome." summary={summary} />
      </MarketingPageShell>
    </>
  );
}
