"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  Cloud,
  Layers3,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  PlatformCard,
  CTASection,
} from "@/components/system";
import { PLATFORM_OVERVIEW } from "@/lib/content/platform-os";
import { PLATFORM_OS } from "@/lib/product-ia";
import { VERTICALS } from "@/lib/content/verticals";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const PLATFORM_LAYERS = [
  {
    label: "Experience",
    title: "RINADS Experience",
    description: "The public site, operating interfaces, portals, and product surfaces people use.",
    icon: Layers3,
  },
  {
    label: "Interface",
    title: "RINPO",
    description: "The persistent conversational interface that helps people understand and navigate RINADS.",
    icon: Bot,
  },
  {
    label: "Intelligence",
    title: "RINADS Intelligence",
    description: "Context, recommendations, tools, permission-aware guidance, and controlled action flows.",
    icon: BrainCircuit,
  },
  {
    label: "Systems",
    title: "Operating System Suite",
    description: "Eight connected operating systems for business, commerce, growth, logistics, creation, building, learning, and automation.",
    icon: Workflow,
  },
  {
    label: "Foundation",
    title: "RINADS Cloud",
    description: "Identity, tenancy, data, APIs, events, storage, integrations, runtime, and infrastructure.",
    icon: Cloud,
  },
] as const;

const BUSINESS_FLOW = [
  "Lead",
  "Customer",
  "Proposal",
  "Project",
  "Invoice",
  "Payment",
  "Order",
  "Shipment",
  "Follow-up",
] as const;

const GOVERNANCE = [
  {
    title: "Organization context",
    description: "Product access and business data are resolved through tenant-aware application context.",
  },
  {
    title: "Permissions",
    description: "Sensitive operations remain subject to authorization rules instead of relying on AI intent alone.",
  },
  {
    title: "Approvals",
    description: "Runtime workflows can pause at approval gates before higher-risk steps continue.",
  },
  {
    title: "Audit and events",
    description: "Platform primitives exist for auditable mutations, business events, workflow state, and correlated operations.",
  },
] as const;

export function PlatformClient() {
  const { openPhoneScreen } = useRinpo();
  const operatingSystems = PLATFORM_OS.filter((item) => item.section !== "Core");

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={PLATFORM_OVERVIEW.eyebrow}
        headline={PLATFORM_OVERVIEW.headline}
        summary="One connected operating platform for business — with RINPO as the interface, RINADS Intelligence as the intelligence layer, eight Operating Systems, and RINADS Cloud as the shared foundation."
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/rinpo"
        secondaryLabel="Talk to RINPO"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 lg:grid-cols-5">
            {PLATFORM_LAYERS.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <article
                  key={layer.title}
                  className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                      {String(index + 1).padStart(2, "0")} · {layer.label}
                    </span>
                    <Icon size={18} className="text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-lg font-bold text-[var(--text-primary)]">{layer.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{layer.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-rinads-primary/35 bg-rinads-primary/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINADS Services</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Services surround the platform as implementation and delivery capability. They are not a technical runtime layer between the Operating Systems and RINADS Cloud.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Connected business lifecycle</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              One business state across connected systems.
            </h2>
            <p className="mt-5 max-w-xl text-[var(--text-muted)]">
              RINADS is designed so the customer, work, commerce, logistics, automation, and intelligence layers can operate around shared organization context rather than isolated app silos.
            </p>
            <button
              type="button"
              onClick={() =>
                openPhoneScreen(
                  "chat",
                  "Explain how a lead can move through CRM, project work, payment, order, shipment, and follow-up in RINADS."
                )
              }
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              Ask RINPO to explain
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <ol className="flex min-w-max items-center">
              {BUSINESS_FLOW.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                    {step}
                  </span>
                  {index < BUSINESS_FLOW.length - 1 ? (
                    <ArrowRight size={16} className="mx-2 text-rinads-primary/60" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINPO</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                One persistent interface across the platform.
              </h2>
              <p className="mt-5 text-[var(--text-muted)]">
                RINPO gives the public experience and connected products a consistent way to ask, understand, recommend, and—where supported—move into governed action.
              </p>
              <Link href="/rinpo" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
                Explore RINPO
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-black p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Interaction model</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {["Ask", "Understand", "Recommend", "Approve", "Act", "Audit"].map((step, index) => (
                  <div key={step} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                    <p className="text-[10px] font-semibold text-white/35">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-2 text-sm font-semibold">{step}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-white/50">
                The public website demonstrates this lifecycle. Execution is only enabled in product contexts where the required tool, permission, confirmation, or runtime path actually exists.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Operating System suite</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Eight systems on one platform core.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {operatingSystems.map((os) => (
              <PlatformCard
                key={os.href}
                title={os.label}
                description={os.description ?? ""}
                href={os.href}
                eyebrow={os.section}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <Building2 size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Vertical configuration</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Industry experiences without rebuilding the platform.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((vertical) => (
              <Link
                key={vertical.slug}
                href={`/solutions/${vertical.slug}`}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-rinads-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
                    {vertical.type}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    {vertical.status === "available" ? "Available" : "Coming soon"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
                  {vertical.slug === "nursery" ? "Landscape & Nursery" : vertical.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{vertical.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Cloud size={28} className="text-rinads-primary" aria-hidden />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINADS Cloud</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Shared foundation beneath every operating surface.
              </h2>
              <p className="mt-5 text-white/60">
                The platform repository already separates identity, tenancy, business domains, runtime, intelligence, billing, CMS, and product apps into shared packages and applications.
              </p>
              <Link href="/platform/rinads-cloud" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
                Explore RINADS Cloud
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Identity + tenancy", "Authentication, organization context, and isolation foundations."],
                ["Domain services", "Commerce, operations, salon, billing, and shared platform packages."],
                ["Runtime", "Events, workflows, outbox, workers, retries, and approval-aware execution."],
                ["Data + infrastructure", "PostgreSQL, storage, APIs, integrations, and deployment foundations."],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <ShieldCheck size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Governance</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Intelligence operates inside platform controls.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {GOVERNANCE.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>

          <Link
            href="/platform/rinads-intelligence"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
          >
            Explore RINADS Intelligence
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <CTASection
        headline="One intelligent platform."
        summary="Start with the outcome. RINPO helps you find the right operating system, solution, or implementation path."
      />
    </MarketingPageShell>
  );
}
