"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { trackMarketing } from "@/lib/analytics";

const BUSINESS_TYPES = [
  "Salon / beauty",
  "Retail",
  "Landscape & nursery",
  "Services / agency",
  "Healthcare practice (ops)",
  "Other",
] as const;

const TEAM_SIZES = ["1–10", "11–50", "51–200", "200+"] as const;

const PROBLEMS = [
  "Disconnected tools",
  "Manual follow-ups",
  "Commerce & fulfilment friction",
  "No single view of customers",
  "Hard to automate safely",
  "Team capability gaps",
] as const;

const AUTOMATION = ["Mostly manual", "Some tools, little automation", "Automating some workflows", "Actively scaling automation"] as const;

const GROWTH = ["Acquire customers", "Retain & expand", "Operational efficiency", "New products / channels"] as const;

type ResultCategory =
  | "Fragmented Operations"
  | "Connected Operations"
  | "Automation Ready"
  | "Intelligence Ready";

function scoreResult(input: {
  toolsComplexity: number;
  automationIndex: number;
  problemIndex: number;
}): ResultCategory {
  const score = input.toolsComplexity + input.automationIndex + (input.problemIndex <= 1 ? 0 : 1);
  if (score <= 2) return "Fragmented Operations";
  if (score <= 4) return "Connected Operations";
  if (score <= 6) return "Automation Ready";
  return "Intelligence Ready";
}

const PATHWAYS: Record<ResultCategory, string> = {
  "Fragmented Operations": "Start with Business OS to consolidate customers, work and money — then add Commerce or Marketing as needed.",
  "Connected Operations": "Connect Business OS + Commerce OS, and use RINPO to surface what needs attention across teams.",
  "Automation Ready": "Layer Automation OS with permission-aware workflows, keeping human approval where required.",
  "Intelligence Ready": "Lean into RINPO + RINADS Intelligence on your connected systems for recommendations that respect governance.",
};

export function BusinessAssessment() {
  const formId = useId();
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [tools, setTools] = useState("");
  const [problem, setProblem] = useState("");
  const [automation, setAutomation] = useState("");
  const [growth, setGrowth] = useState("");
  const [done, setDone] = useState(false);

  const result = useMemo(() => {
    if (!done) return null;
    const toolsComplexity = tools.split(",").filter(Boolean).length > 2 ? 2 : tools ? 1 : 0;
    const automationIndex = Math.max(0, AUTOMATION.indexOf(automation as (typeof AUTOMATION)[number]));
    const problemIndex = Math.max(0, PROBLEMS.indexOf(problem as (typeof PROBLEMS)[number]));
    return scoreResult({ toolsComplexity, automationIndex, problemIndex });
  }, [done, tools, automation, problem]);

  function begin() {
    if (!started) {
      setStarted(true);
      trackMarketing("assessment_started", { source: "business_readiness" });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!consent) return;
    setDone(true);
    trackMarketing("assessment_completed", {
      businessType,
      teamSize,
      growth,
    });
  }

  if (done && result) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8" role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
          RINADS Business Readiness Assessment
        </p>
        <h3 className="mt-3 text-2xl font-bold text-foreground">{result}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{PATHWAYS[result]}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          This is a practical orientation guide — not a certification or scientific score.
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

  const fields = [
    {
      label: "Business type",
      value: businessType,
      set: setBusinessType,
      options: BUSINESS_TYPES,
    },
    {
      label: "Team size",
      value: teamSize,
      set: setTeamSize,
      options: TEAM_SIZES,
    },
    {
      label: "Current tools (comma-separated)",
      value: tools,
      set: setTools,
      options: null as readonly string[] | null,
    },
    {
      label: "Biggest operational problem",
      value: problem,
      set: setProblem,
      options: PROBLEMS,
    },
    {
      label: "Automation maturity",
      value: automation,
      set: setAutomation,
      options: AUTOMATION,
    },
    {
      label: "Growth priority",
      value: growth,
      set: setGrowth,
      options: GROWTH,
    },
  ];

  const current = fields[step];

  return (
    <form
      onSubmit={step === fields.length - 1 ? onSubmit : (e) => { e.preventDefault(); setStep((s) => s + 1); }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8"
      aria-labelledby={`${formId}-heading`}
      onFocus={begin}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
        RINADS Business Readiness Assessment
      </p>
      <h2 id={`${formId}-heading`} className="mt-3 text-2xl font-bold text-foreground">
        Find a practical pathway
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A simple orientation — not a certification. Step {step + 1} of {fields.length}.
      </p>

      <div className="mt-6">
        <label htmlFor={`${formId}-field`} className="text-sm font-semibold text-foreground">
          {current.label}
        </label>
        {current.options ? (
          <select
            id={`${formId}-field`}
            className="mt-2 w-full min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-foreground"
            value={current.value}
            required
            onChange={(e) => current.set(e.target.value)}
          >
            <option value="">Select…</option>
            {current.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`${formId}-field`}
            className="mt-2 w-full min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-foreground"
            value={current.value}
            onChange={(e) => current.set(e.target.value)}
            placeholder="e.g. spreadsheets, WhatsApp, POS"
          />
        )}
      </div>

      {step === fields.length - 1 ? (
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
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            className="min-h-11 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          className="min-h-11 rounded-full bg-rinads-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!current.value || (step === fields.length - 1 && !consent)}
        >
          {step === fields.length - 1 ? "See my pathway" : "Continue"}
        </button>
      </div>
    </form>
  );
}
