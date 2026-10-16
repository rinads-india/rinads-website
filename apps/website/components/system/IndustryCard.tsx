"use client";

import Link from "next/link";
import { ProductStatus } from "@/components/system/ProductStatus";
import type { SolutionCatalogEntry } from "@/lib/content/solutionCatalog";
import { trackMarketing } from "@/lib/analytics";

type IndustryCardProps = {
  solution: SolutionCatalogEntry;
};

export function IndustryCard({ solution }: IndustryCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold uppercase tracking-wide text-foreground">{solution.industry}</h3>
        <ProductStatus status={solution.status} />
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{solution.outcome}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/80">Powered by: </span>
        {solution.poweredBy.join(" + ")}
      </p>
      <Link
        href={solution.href}
        onClick={() =>
          trackMarketing("industry_solution_clicked", {
            industry: solution.slug,
            status: solution.status,
          })
        }
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-rinads-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
      >
        {solution.ctaLabel}
      </Link>
    </article>
  );
}
