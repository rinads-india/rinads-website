"use client";

import Link from "next/link";
import { AvailabilityBadge } from "@/components/system/AvailabilityBadge";
import type { SolutionCatalogEntry } from "@/lib/content/solutionCatalog";
import { trackMarketing } from "@/lib/analytics";

type IndustryEditionCardProps = {
  edition: SolutionCatalogEntry;
};

export function IndustryEditionCard({ edition }: IndustryEditionCardProps) {
  return (
    <Link
      href={edition.href}
      onClick={() =>
        trackMarketing("industry_solution_clicked", {
          slug: edition.slug,
          href: edition.href,
        })
      }
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Industry RINASPACE
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground group-hover:text-rinads-primary">
            {edition.editionName}
          </h3>
        </div>
        <AvailabilityBadge status={edition.status} />
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{edition.outcome}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        Powered by {edition.poweredBy.join(" · ")}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
        {edition.ctaLabel} →
      </p>
    </Link>
  );
}
