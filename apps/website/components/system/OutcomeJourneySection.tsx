import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OUTCOME_JOURNEYS } from "@/lib/content/outcome-journeys";

/**
 * Enterprise IA: one job — help visitors discover products from outcomes.
 * No cards-as-decoration beyond interactive links; no invented metrics.
 */
export function OutcomeJourneySection({
  eyebrow = "Start from your outcome",
  headline = "Find the right RINADS path.",
}: {
  eyebrow?: string;
  headline?: string;
}) {
  return (
    <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="outcome-journey-heading">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">{eyebrow}</p>
        <h2
          id="outcome-journey-heading"
          className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl"
        >
          {headline}
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
          Each path links to an existing product or commercial surface. Availability labels on those
          pages stay authoritative.
        </p>

        <ul className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {OUTCOME_JOURNEYS.map((journey) => (
            <li key={journey.id}>
              <Link
                href={journey.href}
                className="group flex min-h-11 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              >
                <span className="text-base font-bold text-[var(--text-primary)]">{journey.outcome}</span>
                <span className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">{journey.summary}</span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary">
                  {journey.cta}
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
