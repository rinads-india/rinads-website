"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FileClock,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import {
  CTASection,
  MarketingPageShell,
  PageHero,
} from "@/components/system";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const CALL_FLOW = [
  "Call arrives",
  "Identify intent",
  "Use permitted context",
  "Respond or draft next step",
  "Escalate / approve",
  "Record outcome",
] as const;

export function PhoneClient() {
  const { openPhoneScreen } = useRinpo();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINPO Phone"
        headline="A governed business-calling experience for RINPO."
        summary="RINPO Phone is the product direction for connecting business calls to RINADS context, workflows, approvals, and follow-up. The current repository does not contain a live PSTN/telephony provider connector, so this page is a product demonstration rather than a live calling service."
        primaryHref="/projects"
        primaryLabel="Plan phone integration"
        secondaryHref="/rinpo"
        secondaryLabel="RINPO overview"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
              <CircleDot size={14} className="text-rinads-primary" aria-hidden />
              Product demonstration · no live phone call
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              A call should enter the same operating context as every other RINPO channel.
            </h2>
            <p className="mt-5 max-w-xl text-[var(--text-muted)]">
              The useful part is not simply voice on a phone line. The useful part is connecting a conversation to customer context, work, permissions, approvals, and an auditable follow-up path.
            </p>
            <button
              type="button"
              onClick={() =>
                openPhoneScreen(
                  "chat",
                  "Help me plan a RINPO Phone integration for inbound and outbound business calling, including permissions, escalation, provider integration, and call outcomes."
                )
              }
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              Plan with RINPO
              <ArrowRight size={15} aria-hidden />
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-black text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
                  Simulated call
                </p>
                <p className="mt-1 text-sm text-white/45">Demo customer · fictional transcript</p>
              </div>
              <PhoneCall size={21} className="text-rinads-primary" aria-hidden />
            </div>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Intent", "Appointment change"],
                  ["Context", "Customer record found"],
                  ["Risk", "Low"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35">{label}</p>
                    <p className="mt-1 text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35">
                    Caller
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    “Can I move tomorrow&apos;s appointment to the evening?”
                  </p>
                </div>
                <div className="rounded-2xl border border-rinads-primary/30 bg-rinads-primary/10 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-rinads-primary">
                    RINPO
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    “I can check the available slots. Any actual booking change would still use the connected product&apos;s appointment rules and authorization path.”
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/35">
                  Outcome
                </p>
                <p className="mt-2 text-sm font-semibold">Draft next step · no mutation executed in this demo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
            Call lifecycle
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Conversation → context → governed next step.
          </h2>

          <div className="mt-10 overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center">
              {CALL_FLOW.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                    {step}
                  </span>
                  {index < CALL_FLOW.length - 1 ? (
                    <ArrowRight size={16} className="mx-2 text-rinads-primary/60" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-rinads-primary" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Required production controls
              </p>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              Telephony needs more than a model and a phone number.
            </h2>
            <p className="mt-5 text-[var(--text-muted)]">
              A real deployment needs provider connectivity, consent and recording rules where applicable, identity and tenant context, escalation, failure handling, observability, and clear ownership of what RINPO may or may not do.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              ["Provider integration", "Inbound/outbound telephony connector, number configuration, webhooks, and delivery state."],
              ["Permissions + escalation", "Determine which requests can be answered, drafted, approved, transferred, or refused."],
              ["Call record", "Store only the metadata/transcript/recording data that the product is designed and permitted to retain."],
              ["Audit + follow-up", "Connect outcomes to the relevant customer or workflow rather than losing them after the call."],
            ].map(([title, detail], index) => (
              <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-start gap-3">
                  {index === 3 ? (
                    <FileClock size={18} className="mt-0.5 shrink-0 text-rinads-primary" aria-hidden />
                  ) : (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-rinads-primary" aria-hidden />
                  )}
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
            Current repository boundary
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            The current RINADS repository contains the RINPO web/chat/voice UI, runtime and business-tool foundations, but no live telephony/PSTN connector was found. RINPO Phone is therefore presented as an integration-ready product direction, not as an already-live calling service.
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
          >
            Define a phone-integration project
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <CTASection
        headline="Connect conversations to operations."
        summary="Plan RINPO Phone as a governed telephony integration around the RINADS platform, not as an unbounded autonomous caller."
      />
    </MarketingPageShell>
  );
}
