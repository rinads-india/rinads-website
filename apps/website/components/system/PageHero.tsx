import Link from "next/link";

type PageHeroProps = {
  eyebrow: string;
  headline: string;
  summary: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PageHero({
  eyebrow,
  headline,
  summary,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-28 md:px-12 md:pb-20 md:pt-36 lg:px-20">
      <div className="pointer-events-none absolute inset-0 rinads-aurora opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-foreground md:text-6xl">
          {headline}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{summary}</p>
        {(primaryHref || secondaryHref) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryHref && primaryLabel ? (
              <Link
                href={primaryHref}
                className="rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
              >
                {primaryLabel}
              </Link>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
