"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { PlatformCard } from "@/components/system/PlatformCard";
import { VerticalCard } from "@/components/system/VerticalCard";
import { ServiceCard } from "@/components/system/ServiceCard";
import { CourseCard } from "@/components/system/CourseCard";
import { CTASection } from "@/components/system/CTASection";
import { PLATFORM_OS } from "@/lib/product-ia";
import { ACADEMY_MODEL, ACADEMY_PROGRAMS } from "@/lib/content/academy";
import { VERTICALS } from "@/lib/content/verticals";
import { SERVICE_LINES } from "@/lib/content/services";
import { CommercePreview } from "@/components/home/previews/CommercePreview";
import { LogisticsPreview } from "@/components/home/previews/LogisticsPreview";
import { MarketingPreview } from "@/components/home/previews/MarketingPreview";
import { BuildPreview } from "@/components/home/previews/BuildPreview";
import { RinpoSection } from "@/components/home/RinpoSection";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const PROOF_ITEMS = [
  { value: "8", label: "Operating Systems" },
  { value: "1", label: "Persistent RINPO interface" },
  { value: "6", label: "Industry configurations" },
  { value: "1", label: "Connected platform core" },
] as const;

const ARCHITECTURE = [
  {
    number: "01",
    name: "RINADS Experience",
    detail: "Public experience, product interfaces, portals, and operating surfaces.",
    icon: Boxes,
  },
  {
    number: "02",
    name: "RINPO",
    detail: "The persistent interface through which people ask, understand, and operate.",
    icon: Bot,
  },
  {
    number: "03",
    name: "RINADS Intelligence",
    detail: "Context, reasoning, recommendations, permissions, and governed AI behaviour.",
    icon: BrainCircuit,
  },
  {
    number: "04",
    name: "Operating Systems",
    detail: "Business, Commerce, Marketing, Logistics, Creative, Build, Academy, and Automation.",
    icon: Workflow,
  },
  {
    number: "05",
    name: "RINADS Cloud",
    detail: "The connected data, API, event, integration, and infrastructure foundation.",
    icon: Cloud,
  },
] as const;

const INTENTS = [
  {
    label: "Run",
    title: "Run my business",
    description: "Customers, work, money, operations, and management.",
    prompt: "Show me how RINADS can help run my business.",
  },
  {
    label: "Build",
    title: "Build software",
    description: "Move from requirement to architecture, implementation, test, and deployment.",
    prompt: "I want to build software. Show me how RINADS approaches it.",
  },
  {
    label: "Grow",
    title: "Grow my brand",
    description: "Marketing, campaigns, content, commerce, and customer growth.",
    prompt: "Show me how RINADS can help grow my brand.",
  },
  {
    label: "Create",
    title: "Create content",
    description: "Brief, script, image, video, voice, review, and publishing.",
    prompt: "Show me how Creative OS can help me create content.",
  },
  {
    label: "Automate",
    title: "Automate operations",
    description: "Triggers, integrations, approvals, notifications, and audit.",
    prompt: "Help me identify business operations I can automate.",
  },
  {
    label: "Learn",
    title: "Train people",
    description: "Learn, practice, work, ship, measure, improve, and certify.",
    prompt: "Show me how RINADS Academy can train my team.",
  },
] as const;

const CONNECTED_WORKFLOW = [
  "Lead",
  "CRM",
  "Proposal",
  "Project",
  "Invoice",
  "Payment",
  "Campaign",
  "Order",
  "Shipment",
  "Next action",
] as const;

const TRUST_ITEMS = [
  {
    title: "Tenant-aware architecture",
    description: "Business data and product access are designed around organization context rather than a single shared workspace.",
  },
  {
    title: "Permissions before action",
    description: "RINPO and product workflows must respect the same authorization boundaries as the operating system.",
  },
  {
    title: "Human approval paths",
    description: "Sensitive or meaningful actions can be held for review instead of treating AI output as automatic authority.",
  },
  {
    title: "Events and audit",
    description: "The platform architecture includes event and audit primitives so important system activity can remain traceable.",
  },
] as const;

const BUILT_SURFACES = [
  {
    title: "R GLOW · Salon OS",
    description: "A vertical operating surface for appointments, clients, services, loyalty, campaigns, and staff workflows.",
    href: "/solutions/salon",
  },
  {
    title: "Omnichannel Commerce",
    description: "Storefront, customer account, owner operations, orders, fulfilment, support, and commerce foundations.",
    href: "/platform/commerce-os",
  },
  {
    title: "RINPO",
    description: "A persistent public interface plus product-side intelligence and controlled tool flows across the platform.",
    href: "/rinpo",
  },
] as const;

function IntentRouter() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section className="px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Start with intent</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          What do you want RINADS to do?
        </h2>
        <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
          Start from the outcome. RINPO can route the conversation toward the operating system, service, or learning path that fits.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTENTS.map((intent) => (
            <button
              key={intent.label}
              type="button"
              onClick={() => openPhoneScreen("chat", intent.prompt)}
              className="group min-h-[180px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition hover:-translate-y-0.5 hover:border-rinads-primary/45 hover:shadow-[0_18px_48px_rgba(159,75,199,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
                  {intent.label}
                </span>
                <ArrowRight size={16} className="text-[var(--text-muted)] transition group-hover:text-rinads-primary" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[var(--text-primary)]">{intent.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{intent.description}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoWorkspace() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section id="platform-demo" className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Sparkles size={14} className="text-rinads-primary" aria-hidden />
            Demo workspace · synthetic data
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            See the operating platform, not another feature list.
          </h2>
          <p className="mt-5 text-[var(--text-muted)]">
            This demonstration uses fictional values to show how business state and RINPO guidance can appear together. It is not customer performance data.
          </p>
          <button
            type="button"
            onClick={() => openPhoneScreen("chat", "Show me what needs attention in this demo business workspace.")}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            Review with RINPO
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">Business OS</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Demo workspace</p>
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
              ["17", "Shipment exceptions"],
            ].map(([value, label]) => (
              <div key={label} className="bg-[var(--surface)] p-5">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Attention queue</p>
              <div className="mt-4 space-y-3">
                {[
                  ["7 leads", "No follow-up scheduled", "warning"],
                  ["2 projects", "Milestone risk", "critical"],
                  ["3 invoices", "Overdue", "warning"],
                ].map(([title, detail, tone]) => (
                  <div key={title} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{detail}</p>
                    </div>
                    <span
                      className={
                        tone === "critical"
                          ? "h-2.5 w-2.5 rounded-full bg-red-500"
                          : "h-2.5 w-2.5 rounded-full bg-amber-500"
                      }
                      aria-hidden
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO</p>
              <p className="mt-4 text-lg font-semibold">Three areas need attention.</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Follow-up is the clearest immediate risk. I can explain the issue and prepare the next steps for review.
              </p>
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-white/60">
                Recommendation only · execution requires supported permissions and approval paths.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeSections() {
  const operatingSystems = PLATFORM_OS.filter((item) => item.section !== "Core");

  return (
    <>
      <section className="border-y border-[var(--border)] bg-[var(--surface)] px-6 md:px-12 lg:px-20" aria-label="RINADS platform scope">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[var(--border)] sm:grid-cols-4 sm:divide-y-0">
          {PROOF_ITEMS.map((item) => (
            <div key={item.label} className="px-4 py-6 text-center">
              <p className="text-2xl font-black text-[var(--text-primary)]">{item.value}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Platform architecture</p>
          <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                One platform. Clear layers.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
                The public experience should show how RINPO, intelligence, operating systems, and cloud fit together instead of asking visitors to infer the architecture.
              </p>
            </div>
            <Link href="/platform" className="text-sm font-semibold text-rinads-primary hover:underline">
              Explore architecture →
            </Link>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-5">
            {ARCHITECTURE.map((layer) => {
              const Icon = layer.icon;
              return (
                <article key={layer.number} className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rinads-primary">{layer.number}</span>
                    <Icon size={18} className="text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[var(--text-primary)]">{layer.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{layer.detail}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-rinads-primary/35 bg-rinads-primary/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINADS Services</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Human implementation, creative, growth, transformation, and training capability around the platform — not a runtime layer between the operating systems and cloud.
            </p>
          </div>
        </div>
      </section>

      <IntentRouter />

      <DemoWorkspace />

      <RinpoSection />

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Operating System suite</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Eight operating systems. One connected core.
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

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Connected workflow</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Business state should move across the platform, not disappear between apps.
          </h2>

          <div className="mt-10 overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center">
              {CONNECTED_WORKFLOW.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                    {step}
                  </span>
                  {index < CONNECTED_WORKFLOW.length - 1 ? (
                    <ArrowRight className="mx-2 text-rinads-primary/60" size={16} aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Industry configurations</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                One RINADS core. Configured for the industry.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
                Vertical solutions reuse the platform foundation rather than becoming isolated technology stacks.
              </p>
            </div>
            <Link href="/solutions" className="text-sm font-semibold text-rinads-primary hover:underline">
              Explore solutions →
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((vertical) => (
              <VerticalCard
                key={vertical.slug}
                name={vertical.slug === "nursery" ? "Landscape & Nursery" : vertical.name}
                type={vertical.type}
                summary={vertical.summary}
                href={`/solutions/${vertical.slug}`}
                status={vertical.status}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Product proof</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Built surfaces inside the RINADS platform.
          </h2>
          <p className="mt-4 max-w-2xl text-white/60">
            This section describes product surfaces present in the RINADS codebase. It does not imply customer results or unsupported deployment claims.
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {BUILT_SURFACES.map((surface) => (
              <Link
                key={surface.title}
                href={surface.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-rinads-primary/40 hover:bg-white/[0.07]"
              >
                <p className="text-lg font-bold">{surface.title}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{surface.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary">
                  Explore
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <CommercePreview />
            <LogisticsPreview />
            <MarketingPreview />
            <BuildPreview />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-rinads-primary" size={24} aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Trust by architecture</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Intelligence should operate inside business controls.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {TRUST_ITEMS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-rinads-primary" aria-hidden />
                  <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
          <Link href="/platform/rinads-intelligence" className="mt-7 inline-block text-sm font-semibold text-rinads-primary hover:underline">
            Explore RINADS Intelligence →
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Services</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Need RINADS implemented for you?
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
            Services sit around the platform: strategy, implementation, creative, growth, automation, transformation, and training.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LINES.map((service) => (
              <ServiceCard
                key={service.slug}
                name={service.name}
                verb={service.slug === "ai" ? "Intelligence" : service.verb}
                summary={service.summary}
                href={`/services/${service.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 text-rinads-primary" size={24} aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">RINADS Academy</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Learn by doing real work.
              </h2>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {ACADEMY_MODEL.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-rinads-primary/35 bg-rinads-primary/[0.04] px-3 py-1.5 text-xs font-semibold text-rinads-primary">
                  {step}
                </span>
                {index < ACADEMY_MODEL.length - 1 ? (
                  <ArrowRight size={13} className="text-[var(--text-muted)]" aria-hidden />
                ) : null}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ACADEMY_PROGRAMS.filter((program) => ["ai", "software", "founder"].includes(program.slug)).map((program) => (
              <CourseCard
                key={program.slug}
                name={program.name}
                summary={program.summary}
                href={`/academy/${program.slug}`}
                formats={program.format}
              />
            ))}
          </div>

          <Link href="/academy" className="mt-8 inline-block text-sm font-semibold text-rinads-primary hover:underline">
            Explore Academy →
          </Link>
        </div>
      </section>

      <CTASection
        headline="Enter the operating platform."
        summary="Talk to RINPO about what you want to run, build, grow, automate, create, or learn."
      />
    </>
  );
}
