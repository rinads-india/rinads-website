import Link from "next/link";
import type { CaseStudy } from "@/lib/content/case-studies";

export type CustomerEvidenceData = {
  business: string;
  problem: string;
  beforeRinads: string;
  implementation: string;
  rinpoRole?: string;
  workflow?: string;
  verifiedResult: string;
  technology?: string;
};

const FIELDS: { key: keyof CustomerEvidenceData; label: string }[] = [
  { key: "business", label: "Business" },
  { key: "problem", label: "Problem" },
  { key: "beforeRinads", label: "Before RINADS" },
  { key: "implementation", label: "Implementation" },
  { key: "rinpoRole", label: "RINPO role" },
  { key: "workflow", label: "Workflow" },
  { key: "verifiedResult", label: "Verified result" },
  { key: "technology", label: "Technology" },
];

export function caseStudyToEvidence(study: CaseStudy): CustomerEvidenceData {
  const technology = [
    ...study.operatingSystems,
    ...study.integrations,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    business: `${study.customerName} — ${study.industry}${study.location ? ` (${study.location})` : ""}`,
    problem: study.problem,
    beforeRinads: study.previousWorkflow,
    implementation: study.implementationScope,
    rinpoRole: study.rinpoRole ?? study.rinadsSolution,
    workflow: study.workflow ?? study.previousWorkflow,
    verifiedResult: study.results,
    technology: technology || undefined,
  };
}

type CustomerEvidenceProps = {
  data: CustomerEvidenceData;
  href?: string;
  className?: string;
};

/** Renders approved case-study fields only — never invents testimonials or metrics. */
export function CustomerEvidence({ data, href, className = "" }: CustomerEvidenceProps) {
  const content = (
    <dl className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      {FIELDS.map(({ key, label }) => {
        const value = data[key];
        if (!value?.trim()) return null;
        return (
          <div key={key} className="border border-white/10 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-2 text-sm leading-6 text-foreground/90">{value}</dd>
          </div>
        );
      })}
    </dl>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-rinads-primary/40"
      >
        {content}
        <p className="mt-4 text-sm font-semibold text-rinads-primary">Read evidence →</p>
      </Link>
    );
  }

  return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">{content}</div>;
}
