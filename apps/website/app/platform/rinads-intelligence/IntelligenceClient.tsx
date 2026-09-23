"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Eye,
  FileClock,
  KeyRound,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import {
  CTASection,
  MarketingPageShell,
  PageHero,
} from "@/components/system";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const INTELLIGENCE_FLOW = [
  {
    label: "Observe",
    description: "Read permitted business signals from the connected product context.",
    icon: Eye,
  },
  {
    label: "Understand",
    description: "Organize the current request, entities, and operating context.",
    icon: BrainCircuit,
  },
  {
    label: "Recommend",
    description: "Turn available signals into an explainable next step.",
    icon: Lightbulb,
  },
  {
    label: "Authorize",
    description: "Respect product permissions, confirmation, and approval boundaries.",
    icon: KeyRound,
  },
  {
    label: "Act",
    description: "Use registered product tools or runtime actions only where the product supports them.",
    icon: CheckCircle2,
  },
  {
    label: "Audit",
    description: "Keep important platform actions traceable through audit/event primitives where implemented.",
    icon: FileClock,
  },
] as const;

const SIGNALS = [
  "Customers",
  "Orders",
  "Tasks",
  "Inventory",
  "Shipments",
  "Campaigns",
  "Appointments",
  "Runtime events",
] as const;

const TOOL_CLASSES = [
  {
    title: "READ",
    description: "Safe questions and lookups without a business mutation.",
  },
  {
    title: "DRAFT",
    description: "Prepare a proposed change that still requires confirmation before commit.",
  },
  {
    title: "ACTION",
    description: "Execute only through a registered tool and the explicit confirmation/authorization path supported by that product.",
  },
] as const;

export function IntelligenceClient() {
  const { openPhoneScreen } = useRinpo();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINADS Intelligence"
        headline="The intelligence layer behind the operating platform."
        summary="RINADS Intelligence connects business context, recommendations, RINPO tools, permissions, confirmations, and runtime controls so AI assistance can remain useful without bypassing business authority."
        primaryHref="/rinpo"
        primaryLabel="Talk to RINPO"
        secondaryHref="/platform"
        secondaryLabel="Platform overview"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTELLIGENCE_FLOW.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon size={18} className="text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">{item.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Signals</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              Intelligence begins with business context, not a blank chat box.
            </h2>
            <p className="mt-5 text-[var(--text-muted)]">
              The platform can expose different business signals depending on the connected product and the user's permitted context. Not every signal is available in every surface.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SIGNALS.map((signal) => (
              <div key={signal} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Recommendation demo</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <article className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Demo workspace · synthetic data
                </p>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">Opportunity detected</p>
                <h2 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">
                  7 qualified leads have had no follow-up for more than 48 hours.
                </h2>
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                  This example illustrates the recommendation pattern only. The counts are fictional and do not represent a customer account.
                </p>

                <div className="mt-6 rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Recommended next step</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    Review the affected leads and prepare a follow-up sequence.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openPhoneScreen(
                      "chat",
                      "Explain how RINADS Intelligence can detect a follow-up opportunity and what happens before any action is executed."
                    )
                  }
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                >
                  Review with RINPO
                  <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            </article>

            <article className="rounded-3xl border border-[var(--border)] bg-black p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">Governed action</p>
              <div className="mt-5 space-y-3">
                {[
                  ["Suggested by", "RINADS Intelligence"],
                  ["Presented through", "RINPO"],
                  ["Permission", "Checked by product context"],
                  ["Confirmation", "Required where the tool demands it"],
                  ["Execution", "Registered tool or runtime path"],
                  ["Trace", "Audit/event path where implemented"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35">{label}</p>
                    <p className="mt-1 text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Tool model</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Read, draft, then act through explicit boundaries.
          </h2>
          <p className="mt-5 max-w-2xl text-white/60">
            The current intelligence package separates tool behaviour into READ, DRAFT, and ACTION categories. Customer-facing flows do not get silent mutation authority.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TOOL_CLASSES.map((tool) => (
              <article key={tool.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-lg font-bold text-rinads-primary">{tool.title}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{tool.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Hard boundaries</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                RINPO is advisory first, with explicit controls around mutation.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              ["No silent confirmation bypass", "Customer-facing flows do not silently execute ACTION tools."],
              ["No payment submission authority", "The current hard-limit contract does not allow RINPO to submit payments."],
              ["Inventory mutation requires confirmation", "Inventory adjustment is proposed first and committed only through the confirmation tool."],
              ["Owner tools are separately gated", "Owner operations require the relevant services bundle and authorization context."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-rinads-primary" aria-hidden />
                  <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
              </article>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
            Website chat remains a separate public experience and is not presented as equivalent to the full product-side intelligence/tool execution path.
          </p>

          <Link href="/platform/rinads-cloud" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
            See the platform foundation
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <CTASection
        headline="Ask. Understand. Recommend. Govern."
        summary="RINPO is the interface to RINADS Intelligence. Product actions remain inside the permissions, confirmation, and runtime boundaries that actually exist."
      />
    </MarketingPageShell>
  );
}
