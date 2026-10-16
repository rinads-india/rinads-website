"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { trackMarketing } from "@/lib/analytics";

const OPERATING_AREAS = [
  { id: "customer_management", label: "Customer management" },
  { id: "lead_management", label: "Lead management" },
  { id: "work_management", label: "Work management" },
  { id: "finance", label: "Finance" },
  { id: "follow_up", label: "Follow-up" },
  { id: "marketing", label: "Marketing" },
  { id: "commerce", label: "Commerce" },
  { id: "inventory", label: "Inventory" },
  { id: "automation", label: "Automation" },
  { id: "tool_fragmentation", label: "Tool fragmentation" },
] as const;

type AreaId = (typeof OPERATING_AREAS)[number]["id"];

const SCORE_LABELS = [
  "Not in place",
  "Ad hoc",
  "Partially connected",
  "Mostly connected",
  "Operating as one system",
] as const;

const CONFIG_RECOMMENDATIONS: Record<AreaId, string> = {
  customer_management: "Start with Business OS customers and permissions before layering industry editions.",
  lead_management: "Connect Marketing OS capture to Business OS follow-up and RINPO attention signals.",
  work_management: "Use Business OS work items with Automation OS for handoffs and approvals.",
  finance: "Align invoices and payments in Business OS before advanced commerce flows.",
  follow_up: "Automate reminders with human approval gates via RINPO Runtime policies.",
  marketing: "Route campaigns through Marketing OS with CRM context — avoid disconnected ad tools.",
  commerce: "Add Commerce OS when catalogue, checkout, and fulfilment need one thread.",
  inventory: "Pair Commerce OS inventory with Business OS operations for salons, retail, or nursery.",
  automation: "Layer Automation OS once customer and work data live in one tenant.",
  tool_fragmentation: "Plan a migration path — consolidate into RINADS modules rather than another point tool.",
};

function averageScore(scores: Record<AreaId, number>): number {
  const values = OPERATING_AREAS.map((a) => scores[a.id] ?? 0);
  const sum = values.reduce((acc, v) => acc + v, 0);
  return values.length ? sum / values.length : 0;
}

function recommendConfiguration(scores: Record<AreaId, number>): string[] {
  const sorted = [...OPERATING_AREAS].sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0));
  const weakest = sorted.slice(0, 3);
  return weakest.map((area) => CONFIG_RECOMMENDATIONS[area.id]);
}

export function BusinessAssessment() {
  const formId = useId();
  const [phase, setPhase] = useState<"areas" | "contact" | "done">("areas");
  const [started, setStarted] = useState(false);
  const [areaIndex, setAreaIndex] = useState(0);
  const [scores, setScores] = useState<Partial<Record<AreaId, number>>>({});
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);

  const operatingScore = useMemo(() => {
    if (phase !== "done") return null;
    const full = OPERATING_AREAS.reduce(
      (acc, area) => {
        acc[area.id] = scores[area.id] ?? 0;
        return acc;
      },
      {} as Record<AreaId, number>,
    );
    return {
      overall: Math.round((averageScore(full) / 4) * 100),
      byArea: OPERATING_AREAS.map((area) => ({
        ...area,
        score: full[area.id],
        percent: Math.round(((full[area.id] ?? 0) / 4) * 100),
      })),
      recommendations: recommendConfiguration(full),
    };
  }, [phase, scores]);

  function begin() {
    if (!started) {
      setStarted(true);
      trackMarketing("business_readiness_started", { source: "business_readiness" });
      trackMarketing("assessment_started", { source: "business_readiness" });
    }
  }

  function onAreaSubmit(event: FormEvent) {
    event.preventDefault();
    const area = OPERATING_AREAS[areaIndex];
    if (scores[area.id] === undefined) return;
    if (areaIndex < OPERATING_AREAS.length - 1) {
      setAreaIndex((i) => i + 1);
      return;
    }
    setPhase("contact");
  }

  function onContactSubmit(event: FormEvent) {
    event.preventDefault();
    if (!consent || !name.trim() || !workEmail.trim() || !company.trim()) return;
    const full = OPERATING_AREAS.reduce(
      (acc, area) => {
        acc[area.id] = scores[area.id] ?? 0;
        return acc;
      },
      {} as Record<AreaId, number>,
    );
    const overall = Math.round((averageScore(full) / 4) * 100);
    setPhase("done");
    trackMarketing("business_readiness_completed", { overallScore: overall });
    trackMarketing("assessment_completed", {
      company,
      source: "business_readiness",
    });
  }

  if (phase === "done" && operatingScore) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8" role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Business Operating Score
        </p>
        <p className="mt-3 text-4xl font-black text-foreground">{operatingScore.overall}%</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Orientation only — not a certification. Higher scores suggest more connected operations across
          the areas you rated.
        </p>

        <ul className="mt-8 space-y-3">
          {operatingScore.byArea.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground">{row.label}</span>
              <span className="font-semibold text-rinads-primary">{row.percent}%</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground">Suggested configuration</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {operatingScore.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Thanks — we received your contact details with this score. A human follow-up is optional and
          governed by our privacy policy.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact?intent=demo"
            className="inline-flex min-h-11 items-center rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Book a demo
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            View pricing
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "contact") {
    return (
      <form
        onSubmit={onContactSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8"
        aria-labelledby={`${formId}-contact-heading`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          Business Readiness
        </p>
        <h2 id={`${formId}-contact-heading`} className="mt-3 text-2xl font-bold text-foreground">
          Receive your score and configuration
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact details are collected after you complete the assessment — not before.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor={`${formId}-name`} className="text-sm font-semibold text-foreground">Name</label>
            <input
              id={`${formId}-name`}
              required
              className="mt-2 w-full min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-email`} className="text-sm font-semibold text-foreground">Work email</label>
            <input
              id={`${formId}-email`}
              type="email"
              required
              className="mt-2 w-full min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-foreground"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-company`} className="text-sm font-semibold text-foreground">Company</label>
            <input
              id={`${formId}-company`}
              required
              className="mt-2 w-full min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-foreground"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            I agree RINADS may follow up about this assessment result, as described in the{" "}
            <Link href="/company/privacy" className="text-rinads-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="min-h-11 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold"
            onClick={() => setPhase("areas")}
          >
            Back
          </button>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-rinads-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!consent}
          >
            See my Business Operating Score
          </button>
        </div>
      </form>
    );
  }

  const area = OPERATING_AREAS[areaIndex];
  const currentScore = scores[area.id];

  return (
    <form
      onSubmit={onAreaSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8"
      aria-labelledby={`${formId}-heading`}
      onFocus={begin}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
        RINADS Business Readiness Assessment
      </p>
      <h2 id={`${formId}-heading`} className="mt-3 text-2xl font-bold text-foreground">
        Business Operating Score by area
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Rate how connected this area feels today. Area {areaIndex + 1} of {OPERATING_AREAS.length}.
      </p>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-foreground">{area.label}</legend>
        <div className="mt-3 space-y-2">
          {SCORE_LABELS.map((label, value) => (
            <label
              key={label}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm hover:border-rinads-primary/30"
            >
              <input
                type="radio"
                name={`${formId}-${area.id}`}
                value={value}
                checked={currentScore === value}
                onChange={() => setScores((prev) => ({ ...prev, [area.id]: value }))}
                required
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap gap-3">
        {areaIndex > 0 ? (
          <button
            type="button"
            className="min-h-11 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold"
            onClick={() => setAreaIndex((i) => i - 1)}
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          className="min-h-11 rounded-full bg-rinads-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={currentScore === undefined}
        >
          {areaIndex === OPERATING_AREAS.length - 1 ? "Continue to contact" : "Continue"}
        </button>
      </div>
    </form>
  );
}
