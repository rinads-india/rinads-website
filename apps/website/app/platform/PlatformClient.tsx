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
import { OutcomeJourneySection } from "@/components/system/OutcomeJourneySection";
import { PLATFORM_OVERVIEW } from "@/lib/content/platform-os";
import { PLATFORM_OS } from "@/lib/product-ia";
import { VERTICALS } from "@/lib/content/verticals";
import { getOsAvailability } from "@/lib/content/pricing";
import { getVerticalAvailability } from "@/lib/content/leads";
import { ProductStatus } from "@/components/system/ProductStatus";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const PLATFORM_LAYERS = [
  {
    label: "Experience",
    title: "RINADS Experience",
    description: "The public site, business interfaces, portals, and product surfaces people use.",
    icon: Layers3,
  },
  {
    label: "Interface",
    title: "RINPO",
    description: "The persistent Business Intelligence Character that helps people understand and navigate RINADS.",
    icon: Bot,
  },
  {
    label: "Intelligence",
    title: "RINADS Intelligence",
    description: "Context, recommendations, orchestration, permission-aware guidance, and controlled action flows.",
    icon: BrainCircuit,
  },
  {
    label: "Execution",
    title: "RINPO Runtime",
    description: "Governed execution across agents, tools, workflows, permissions, approvals, actions, and audit.",
    icon: Workflow,
  },
  {
    label: "Identity + workspace",
    title: "RI ID + RI SPACE",
    description: "One identity and one persistent workspace carrying organisation context, permissions, data, and connected business state.",
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
    description: "Sensitive operations remain subject to authorization rules instead of relying on intelligence intent alone.",
  },
  {
    title: "Approvals",
    description: "RINPO Runtime workflows can pause at approval gates before higher-risk steps continue.",
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
        summary="One connected Business Intelligence Platform — RINPO as the interface, RINADS Intelligence as the intelligence layer, RINPO Runtime as governed execution, with RI ID and RI SPACE carrying identity and persistent business context."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a demo"
        secondaryHref="/rinpo"
        secondaryLabel="See how RINPO works"
      />

      <OutcomeJourneySection
        eyebrow="Customer journey"
        headline="Start from the outcome you need."
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
              Services surround the platform as implementation and delivery capability. They are not a technical runtime layer between business capabilities and the RINADS platform core.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Connected business lifecycle</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              One business state across connected capabilities.
            </h2>
            <p className="mt-5 max-w-xl text-[var(--text-muted)]">
              RINADS is designed so customer, work, commerce, logistics, automation, and intelligence capabilities can operate around shared organisation context rather than isolated app silos.
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
                RINPO gives the public experience and connected products a consistent way to ask, understand, recommend, authorize, and—where supported—move into governed action through RINPO Runtime.
              </p>
              <Link href="/rinpo" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
                Explore RINPO
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Governed execution model</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {["Observe", "Understand", "Recommend", "Authorize", "Act", "Audit"].map((step, index) => (
                  <div key={step} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                    <p className="text-[10px] font-semibold text-white/35">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-2 text-sm font-semibold">{step}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-white/50">
                The public website demonstrates this lifecycle. Execution is only enabled in product contexts where the required tool, permission, confirmation, connector, or runtime path actually exists.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Business capabilities</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Connected capabilities on one platform core.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {operatingSystems.map((os) => {
              const slug = os.href.replace("/platform/", "");
              const availability = getOsAvailability(slug);
              return (
                <div key={os.href} className="space-y-2">
                  <PlatformCard
                    title={os.label}
                    description={os.description ?? ""}
                    href={os.href}
                    eyebrow={os.section}
                  />
                  {availability ? <ProductStatus status={availability.status} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <Building2 size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Industry RINASPACES</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Built for your industry without rebuilding the platform.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((vertical) => {
              const availability = getVerticalAvailability(vertical.slug);
              return (
              <Link
                key={vertical.slug}
                href={`/solutions/${vertical.slug}`}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-rinads-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
                    {vertical.type}
                  </span>
                  <ProductStatus status={availability.status} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
                  {vertical.slug === "salon"
                    ? "RI SALON RINASPACE"
                    : vertical.slug === "jewellery"
                      ? "RI JEWELLERY RINASPACE"
                      : vertical.slug === "automotive"
                        ? "RI AUTOMOTIVE RINASPACE"
                        : vertical.slug === "nursery" || vertical.slug === "landscape"
                          ? "RI LANDSCAPE RINASPACE"
                          : vertical.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{vertical.summary}</p>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Cloud size={28} className="text-rinads-primary" aria-hidden />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RI ID + RI SPACE</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                One identity. One persistent business workspace.
              </h2>
              <p className="mt-5 text-white/60">
                RI ID identifies the business and its people. RI SPACE carries organisation context, permissions, connected business state, and the workspace through which RINADS capabilities operate together.
              </p>
              <Link href="/platform/cloud" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
                Explore the platform core
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["RI ID", "Identity, authentication, organisation membership, roles, and permissions."],
                ["RI SPACE", "Persistent business workspace and shared organisation context."],
                ["RINPO Runtime", "Events, workflows, connectors, workers, retries, approvals, and governed execution."],
                ["Platform data", "PostgreSQL, storage, APIs, integrations, audit, and deployment foundations."],
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
            href="/platform/intelligence"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
          >
            Explore RINADS Intelligence
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <CTASection
        headline="One intelligent platform."
        summary="Start with the outcome. RINPO helps you find the right capability, Industry RINASPACE, or implementation path."
      />
    </MarketingPageShell>
  );
}
