"use client";

import { useState } from "react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { trackMarketing } from "@/lib/analytics";

const SCENARIOS = [
  {
    id: "followups",
    label: "Follow-ups",
    question: "Which customers need follow-up?",
    answer: "Three sample leads are waiting for a reply.",
    next: "Review the suggested messages before sending.",
  },
  {
    id: "money",
    label: "Money",
    question: "What needs attention in finance?",
    answer: "Two sample invoices are overdue.",
    next: "Review balances and approve reminders.",
  },
  {
    id: "operations",
    label: "Operations",
    question: "What should my team focus on?",
    answer: "A sample weekend shift needs an owner decision.",
    next: "Review the proposed roster change.",
  },
] as const;

type ScenarioId = (typeof SCENARIOS)[number]["id"];

/**
 * Public, synthetic and deterministic demonstration of RINPO's value proposition.
 * This does NOT call a language model, connect to a tenant, or perform actions.
 */
export function RinpoHeroPreview() {
  const [selected, setSelected] = useState<ScenarioId>("followups");
  const { openPhoneScreen } = useRinpo();
  const scenario = SCENARIOS.find((item) => item.id === selected) ?? SCENARIOS[0];

  return (
    <div className="relative mx-auto w-full max-w-xl min-w-0" aria-label="Illustrative RINPO business demo">
      <div className="pointer-events-none absolute inset-x-10 top-12 h-52 rounded-full bg-rinads-primary/20 blur-[70px]" aria-hidden />
      <div className="relative flex items-center justify-center gap-3 pb-5 sm:gap-7">
        {/* Official RINPO artwork from the existing public asset library. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/rinpo-full-body-transparent-v2.png"
          alt="RINPO, the RINADS business intelligence character"
          width={200}
          height={240}
          className="h-36 w-auto max-w-[38%] shrink-0 object-contain sm:h-48 lg:h-52"
          loading="eager"
          decoding="async"
        />
        <div className="min-w-0 flex-1 rounded-2xl border border-rinads-primary/35 bg-[#1b1027]/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.36)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d8a2f1]">
            RINPO Phone
          </p>
          <p className="mt-2 text-sm font-semibold text-white sm:text-base">
            Ask your business anything.
          </p>
          <p className="mt-2 text-xs leading-5 text-white/65">
            Understand priorities, review recommendations and stay in control of every action.
          </p>
        </div>
      </div>

      <div className="relative min-w-0 rounded-3xl border border-white/15 bg-[#0f0a17]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Example conversation</p>
          <span className="rounded-full border border-rinads-primary/40 bg-rinads-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#e2b9fb]">
            Synthetic demo
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Choose a demonstration scenario">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === item.id}
              onClick={() => {
                setSelected(item.id);
                trackMarketing("rinpo_demo_started", { scenario: item.id });
              }}
              className={
                selected === item.id
                  ? "min-h-10 rounded-full border border-rinads-primary bg-rinads-primary/25 px-3 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  : "min-h-10 rounded-full border border-white/20 px-3 text-xs font-semibold text-white/70 transition hover:border-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4" aria-live="polite">
          <p className="text-xs text-white/50">You ask</p>
          <p className="mt-1 text-sm font-semibold text-white">{scenario.question}</p>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold text-[#d9a3f5]">RINPO · Example answer</p>
            <p className="mt-1 text-sm leading-6 text-white/90">{scenario.answer}</p>
            <p className="mt-2 text-xs leading-5 text-white/65">{scenario.next}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            trackMarketing("hero_try_rinpo", { scenario: selected });
            openPhoneScreen("chat");
          }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-rinads-primary px-4 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Open RINPO Phone
        </button>
        <p className="mt-3 text-center text-[11px] leading-4 text-white/45">
          Example responses above are not live business data and do not execute actions.
        </p>
      </div>
    </div>
  );
}
