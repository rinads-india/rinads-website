"use client";

import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  PackageCheck,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  OperatingSystemDemoConfig,
  OperatingSystemDemoKey,
} from "@/lib/os-demo-config";

function DemoShell({
  config,
  children,
}: {
  config: OperatingSystemDemoConfig;
  children: ReactNode;
}) {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Sparkles size={14} className="text-rinads-primary" aria-hidden />
              {config.demoLabel} · synthetic data
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              {config.signature}
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--text-muted)]">{config.demoSummary}</p>
          </div>
          <p className="max-w-sm text-xs leading-5 text-[var(--text-muted)]">
            This visual demonstrates the intended operating experience. Any counts, amounts, names, or status values shown here are fictional unless explicitly identified otherwise.
          </p>
        </div>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function BusinessDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">Founder Command Center</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Demo company</p>
        </div>
        <span className="rounded-full bg-[var(--status-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-success-fg)]">
          Operating
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[var(--border)] md:grid-cols-4">
        {[
          ["₹2.8L", "Receivable"],
          ["47", "Active leads"],
          ["12", "Active projects"],
          ["5", "Attention items"],
        ].map(([value, label]) => (
          <div key={label} className="bg-[var(--surface)] p-5">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Attention queue</p>
          <div className="mt-4 space-y-3">
            {[
              ["7 leads", "No follow-up scheduled", "Review"],
              ["3 invoices", "Overdue", "Review"],
              ["2 projects", "Milestone risk", "Watch"],
            ].map(([title, detail, action]) => (
              <div key={title} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{detail}</p>
                </div>
                <span className="text-xs font-semibold text-rinads-primary">{action}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO</p>
          <p className="mt-4 text-lg font-semibold">Focus on lead follow-up first.</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            The demo queue suggests a customer-response risk before the financial and project items.
          </p>
        </div>
      </div>
    </div>
  );
}

function CommerceDemo() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
      <div className="grid gap-3 lg:grid-cols-7">
        {[
          "Product",
          "Catalogue",
          "Storefront",
          "Order",
          "Payment",
          "Fulfilment",
          "Customer",
        ].map((step, index) => (
          <div key={step} className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-[10px] font-semibold text-rinads-primary">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Order activity</p>
          <div className="mt-4 space-y-2">
            {[
              ["ORD-2041", "Paid", "Ready to fulfil"],
              ["ORD-2042", "Pending", "Payment review"],
              ["ORD-2043", "Packed", "Carrier handoff"],
            ].map(([id, status, next]) => (
              <div key={id} className="grid grid-cols-[1fr_auto] gap-4 rounded-xl bg-[var(--surface-muted)] p-3">
                <div>
                  <p className="font-mono text-xs text-[var(--text-primary)]">{id}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{next}</p>
                </div>
                <span className="text-xs font-semibold text-rinads-primary">{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO insight</p>
          <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
            Two demo variants are approaching the reorder threshold.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Review stock before the next promotion creates additional demand.
          </p>
        </div>
      </div>
    </div>
  );
}

function MarketingDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="grid gap-px bg-[var(--border)] md:grid-cols-4">
        {[
          ["₹48K", "Demo spend"],
          ["326", "Leads"],
          ["₹147", "Cost / lead"],
          ["61%", "Follow-up rate"],
        ].map(([value, label]) => (
          <div key={label} className="bg-[var(--surface)] p-5">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Campaigns</p>
          <div className="mt-4 space-y-3">
            {[
              ["Local Launch", "Meta", "132 leads", "Active"],
              ["Search Demand", "Google", "94 leads", "Active"],
              ["Reactivation", "WhatsApp", "100 leads", "Review"],
            ].map(([campaign, channel, result, status]) => (
              <div key={campaign} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-[1.4fr_0.7fr_0.7fr_auto] sm:items-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{campaign}</p>
                <p className="text-xs text-[var(--text-muted)]">{channel}</p>
                <p className="text-xs text-[var(--text-muted)]">{result}</p>
                <span className="text-xs font-semibold text-rinads-primary">{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO diagnosis</p>
          <p className="mt-4 text-lg font-semibold">Lead response needs attention.</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            The demo acquisition volume is healthy enough to review, but the follow-up rate suggests the next improvement is operational rather than more spend.
          </p>
        </div>
      </div>
    </div>
  );
}

function LogisticsDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Control Tower</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Provider-neutral shipment view</p>
        </div>
        <PackageCheck size={22} className="text-rinads-primary" aria-hidden />
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {[
            ["SHP-2041", "Carrier A", "In transit", "No exception"],
            ["SHP-2042", "Carrier B", "Exception", "Address review"],
            ["SHP-2043", "Carrier C", "Out for delivery", "No exception"],
            ["SHP-2044", "Carrier A", "Exception", "Handoff delayed"],
          ].map(([id, carrier, status, exception]) => (
            <div key={id} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-[0.8fr_0.8fr_1fr_1fr] sm:items-center">
              <p className="font-mono text-xs text-[var(--text-primary)]">{id}</p>
              <p className="text-xs text-[var(--text-muted)]">{carrier}</p>
              <p className="text-xs font-semibold text-rinads-primary">{status}</p>
              <p className="text-xs text-[var(--text-muted)]">{exception}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO exception review</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
            Review the two exception shipments before the next carrier handoff window.
          </p>
        </div>
      </div>
    </div>
  );
}

function CreativeDemo() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-black p-5 text-white">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Brief", "Ready"],
          ["Concept", "Approved"],
          ["Script", "Approved"],
          ["Visuals", "In production"],
          ["Video", "Queued"],
          ["Voice", "Queued"],
          ["Review", "Waiting"],
          ["Publish", "Waiting"],
        ].map(([stage, status], index) => (
          <div key={stage} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold text-rinads-primary">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-3 text-sm font-semibold">{stage}</p>
            <p className="mt-1 text-xs text-white/45">{status}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Current review gate</p>
          <p className="mt-3 text-lg font-semibold">Visual direction</p>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Character consistency, product accuracy, framing, and campaign format are checked before the video stage continues.
          </p>
        </div>
        <div className="rounded-2xl border border-rinads-primary/30 bg-rinads-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO · Creative Director</p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            The next useful action is to review the visual set against the approved brief before generating motion.
          </p>
        </div>
      </div>
    </div>
  );
}

function BuildDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="grid gap-px bg-[var(--border)] md:grid-cols-4">
        {[
          ["Discovery", "Complete"],
          ["PRD", "Complete"],
          ["Architecture", "Review"],
          ["Build", "Pending"],
        ].map(([stage, state]) => (
          <div key={stage} className="bg-[var(--surface)] p-5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{stage}</p>
            <p className="mt-1 text-xs text-rinads-primary">{state}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Build plan</p>
          <ol className="mt-4 space-y-3">
            {[
              ["01", "Define tenant and permission boundaries"],
              ["02", "Lock domain model and migrations"],
              ["03", "Build product flows"],
              ["04", "Test security and critical journeys"],
              ["05", "Deploy and monitor"],
            ].map(([number, label]) => (
              <li key={number} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                <span className="text-xs font-semibold text-rinads-primary">{number}</span>
                <span className="text-sm text-[var(--text-primary)]">{label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-black p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO build review</p>
          <p className="mt-4 text-lg font-semibold">Architecture review before implementation.</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Confirm tenancy, permissions, data ownership, and failure paths before committing the implementation plan.
          </p>
        </div>
      </div>
    </div>
  );
}

function AcademyDemo() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Learner skill graph</p>
        <div className="mt-5 space-y-4">
          {[
            ["AI foundations", "82%"],
            ["Workflow design", "64%"],
            ["Business application", "51%"],
            ["Shipped project", "25%"],
          ].map(([skill, progress]) => (
            <div key={skill}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{skill}</p>
                <p className="text-xs text-[var(--text-muted)]">{progress}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-rinads-primary"
                  style={{ width: progress }}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO tutor</p>
        <p className="mt-4 text-xl font-bold text-[var(--text-primary)]">Move from practice to a real project.</p>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          The demo learner has enough foundation to apply the current module to a small business workflow instead of consuming another lesson.
        </p>
        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Suggested next activity</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            Design and document one approval workflow.
          </p>
        </div>
      </div>
    </div>
  );
}

function AutomationDemo() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="overflow-x-auto pb-2">
        <ol className="flex min-w-max items-center">
          {[
            ["Trigger", CircleDot],
            ["Condition", GitNodeIcon],
            ["Draft", FileText],
            ["Approval", ShieldCheck],
            ["Action", Play],
            ["Result", CheckCircle2],
            ["Audit", Clock3],
          ].map(([label, Icon], index) => {
            const IconComponent = Icon as ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
            return (
              <li key={String(label)} className="flex items-center">
                <div className="min-w-[120px] rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <IconComponent size={17} className="text-rinads-primary" aria-hidden />
                  <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{String(label)}</p>
                </div>
                {index < 6 ? <ArrowRight size={16} className="mx-2 text-rinads-primary/60" aria-hidden /> : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Execution log</p>
          <div className="mt-4 space-y-2">
            {[
              ["10:02:11", "Trigger received", "Completed"],
              ["10:02:12", "Condition evaluated", "Completed"],
              ["10:02:12", "Approval required", "Waiting"],
            ].map(([time, event, state]) => (
              <div key={event} className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-xl bg-[var(--surface-muted)] p-3 text-xs">
                <span className="font-mono text-[var(--text-muted)]">{time}</span>
                <span className="text-[var(--text-primary)]">{event}</span>
                <span className="font-semibold text-rinads-primary">{state}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO</p>
          <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">Approval is blocking execution by design.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Higher-risk actions should wait rather than silently continue.
          </p>
        </div>
      </div>
    </div>
  );
}

function GitNodeIcon({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M8 7.5 11 16" />
      <path d="M16 7.5 13 16" />
    </svg>
  );
}

const DEMOS: Record<OperatingSystemDemoKey, ComponentType> = {
  "business-os": BusinessDemo,
  "commerce-os": CommerceDemo,
  "marketing-os": MarketingDemo,
  "logistics-os": LogisticsDemo,
  "creative-os": CreativeDemo,
  "build-os": BuildDemo,
  "academy-os": AcademyDemo,
  "automation-os": AutomationDemo,
};

export function OperatingSystemDemo({
  config,
}: {
  config: OperatingSystemDemoConfig;
}) {
  const Demo = DEMOS[config.slug];

  return (
    <DemoShell config={config}>
      <Demo />
    </DemoShell>
  );
}
