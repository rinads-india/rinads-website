"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const ATTENTION_ITEMS = [
  { title: "7 leads", detail: "Need follow-up" },
  { title: "3 invoices", detail: "Overdue" },
  { title: "2 projects", detail: "Milestone risk" },
] as const;

export function RinpoSection() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section className="relative z-20 bg-rinads-primary-darkest px-6 py-20 text-white md:px-12 md:py-28 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/60">
            <Sparkles size={14} className="text-rinads-primary" aria-hidden />
            RINPO · demonstration
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
            From signal to next action
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
            Your business has data. RINPO turns it into direction.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/65 md:text-lg">
            RINPO can help interpret business state, explain what needs attention, and surface the next step through the connected RINADS experience.
          </p>
          <Link
            href="/rinpo"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
          >
            Meet RINPO
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.05] backdrop-blur">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINPO</p>
                <p className="mt-1 text-xs text-white/40">Demo workspace · synthetic data</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
                Recommendation
              </span>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-white/45">YOU</p>
            <p className="mt-1 text-lg font-semibold">&quot;What needs my attention?&quot;</p>

            <div className="mt-6 rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.08] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO</p>
              <p className="mt-3 text-base font-semibold">Three areas need review today.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {ATTENTION_ITEMS.map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-white/50">{item.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/60">
                I can explain the issues and prepare next steps for review. Execution is only available where the product supports the required permissions and approval path.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openPhoneScreen("chat", "Show me how RINPO identifies what needs attention in a business.")}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rinads-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ask RINPO
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
