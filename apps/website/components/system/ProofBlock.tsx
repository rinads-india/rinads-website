import Image from "next/image";
import type { CaseStudy } from "@/lib/content/case-studies";

type ProofBlockProps = {
  study?: CaseStudy | null;
  /** Truthful fallback when no approved customer evidence exists */
  fallback?: {
    headline: string;
    body: string;
    ctaHref?: string;
    ctaLabel?: string;
  };
};

/**
 * Renders approved customer proof only. Never invents logos, KPIs, or quotes.
 */
export function ProofBlock({ study, fallback }: ProofBlockProps) {
  if (!study || study.approvalStatus !== "approved") {
    if (!fallback) return null;
    return (
      <aside className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
        <h3 className="text-xl font-bold text-foreground">{fallback.headline}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{fallback.body}</p>
        {fallback.ctaHref && fallback.ctaLabel ? (
          <a
            href={fallback.ctaHref}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            {fallback.ctaLabel}
          </a>
        ) : null}
      </aside>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        {study.logo ? (
          <Image src={study.logo} alt={`${study.customerName} logo`} width={120} height={40} className="h-10 w-auto object-contain" />
        ) : null}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">{study.industry}</p>
          <h3 className="mt-1 text-xl font-bold text-foreground">{study.customerName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{study.location}</p>
        </div>
      </div>
      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Challenge</dt>
          <dd className="mt-1 text-sm text-foreground/90">{study.problem}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Solution</dt>
          <dd className="mt-1 text-sm text-foreground/90">{study.rinadsSolution}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Modules deployed</dt>
          <dd className="mt-1 text-sm text-foreground/90">{study.operatingSystems.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Result</dt>
          <dd className="mt-1 text-sm text-foreground/90">{study.results}</dd>
        </div>
      </dl>
      {study.quote ? (
        <blockquote className="mt-6 border-l-2 border-rinads-primary/50 pl-4 text-sm italic text-muted-foreground">
          “{study.quote.text}”
          <footer className="mt-2 not-italic font-semibold text-foreground">{study.quote.attribution}</footer>
        </blockquote>
      ) : null}
    </article>
  );
}
