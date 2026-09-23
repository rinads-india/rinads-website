"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Cloud,
  Database,
  GitBranch,
  KeyRound,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import {
  CTASection,
  MarketingPageShell,
  PageHero,
} from "@/components/system";

const CLOUD_STACK = [
  {
    layer: "Applications",
    description: "Public Experience, R GLOW, Storefront, Customer Portal, Owner Portal, and Platform Admin.",
    icon: Boxes,
  },
  {
    layer: "Identity + tenant context",
    description: "Authentication, organization membership, active-org resolution, and tenant-aware access.",
    icon: KeyRound,
  },
  {
    layer: "Domain services",
    description: "Commerce, operations, salon, platform, billing, domains, CMS, and intelligence packages.",
    icon: Network,
  },
  {
    layer: "Runtime",
    description: "Business events, workflows, jobs, approvals, retries, workers, and notification outbox.",
    icon: Workflow,
  },
  {
    layer: "Data + storage",
    description: "PostgreSQL/Supabase-backed schema, RLS foundations, files, and structured business data.",
    icon: Database,
  },
  {
    layer: "Infrastructure",
    description: "Deployment, integrations, APIs, cron/worker execution, and provider adapters.",
    icon: Cloud,
  },
] as const;

const DATA_FLOW = [
  "User / product",
  "Identity",
  "Tenant context",
  "Domain service",
  "Event / workflow",
  "Data",
] as const;

const FOUNDATION_AREAS = [
  {
    title: "Tenant isolation",
    description: "Commerce and operations have tenant-scoped RLS/security tests and organization-aware service patterns.",
  },
  {
    title: "Runtime orchestration",
    description: "Workflow executions and step runs model queued, running, waiting, completed, failed, cancelled, and dead-letter states.",
  },
  {
    title: "Approval-aware steps",
    description: "Workflow steps at or above the configured approval risk threshold can pause in a waiting-for-approval state.",
  },
  {
    title: "Reliable notification queue",
    description: "The notification outbox tracks pending, processing, sent, and failed delivery attempts with idempotency and correlation fields.",
  },
] as const;

const HONEST_LIMITS = [
  "Some provider adapters remain stubs or require live credentials before production use.",
  "Website RINPO chat is still distinct from full product-side intelligence/tool execution.",
  "Some runtime definitions are still backed by built-in code paths rather than fully database-loaded workflow definitions.",
  "Production capability should be described from implemented code and deployment state, not from intended roadmap alone.",
] as const;

export function CloudClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINADS Cloud"
        headline="The shared foundation behind the operating platform."
        summary="RINADS Cloud connects identity, tenancy, domain services, runtime, data, APIs, integrations, and infrastructure so multiple business experiences can operate on one platform core."
        primaryHref="/platform"
        primaryLabel="Explore platform"
        secondaryHref="/platform/rinads-intelligence"
        secondaryLabel="RINADS Intelligence"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 lg:grid-cols-3">
            {CLOUD_STACK.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.layer} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon size={18} className="text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">{item.layer}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Request path</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Business operations move through identity and tenant context before domain work.
          </h2>
          <p className="mt-5 max-w-2xl text-white/60">
            The exact path varies by product, but the platform architecture separates user/session context from domain services and runtime side effects.
          </p>

          <div className="mt-10 overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center">
              {DATA_FLOW.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold">
                    {step}
                  </span>
                  {index < DATA_FLOW.length - 1 ? (
                    <ArrowRight size={16} className="mx-2 text-rinads-primary/70" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <GitBranch size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Runtime</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Events and workflows connect domain state to reliable execution.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Business events", "Carry correlated platform state changes into runtime processing."],
              ["Workflow executions", "Track one workflow run and the status of its ordered steps."],
              ["Approval gates", "Pause eligible workflow steps until the required approval path continues them."],
              ["Outbox", "Queue customer and operational notifications with deduplication and delivery status."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Platform controls</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Trust is implemented as boundaries, not marketing badges.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FOUNDATION_AREAS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">AI gateway position</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              Keep model providers behind the RINADS intelligence boundary.
            </h2>
            <p className="mt-5 text-[var(--text-muted)]">
              Model providers should remain replaceable implementation choices. Business permissions, tenant context, tools, approvals, and audit belong to the RINADS platform rather than to any external model.
            </p>
            <Link
              href="/platform/rinads-intelligence"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
            >
              Explore RINADS Intelligence
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-black p-6 text-white">
            <div className="space-y-3">
              {[
                ["RINPO / product request", "User intent and current product context"],
                ["RINADS Intelligence", "Policy, tool selection, context, recommendations"],
                ["Model / inference adapter", "Replaceable compute provider"],
                ["Registered tool / runtime", "Governed business-side execution path"],
              ].map(([title, description], index) => (
                <div key={title}>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">{description}</p>
                  </div>
                  {index < 3 ? (
                    <div className="flex justify-center py-2">
                      <span className="text-rinads-primary" aria-hidden>↓</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Current boundaries</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Cloud architecture should show what is implemented and what still needs production work.
          </h2>

          <div className="mt-10 grid gap-3">
            {HONEST_LIMITS.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rinads-primary" aria-hidden />
                <p className="text-sm leading-6 text-[var(--text-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="One shared platform foundation."
        summary="RINADS Cloud supports the operating systems, RINADS Intelligence, and product experiences through shared identity, domain, runtime, data, and infrastructure layers."
      />
    </MarketingPageShell>
  );
}
