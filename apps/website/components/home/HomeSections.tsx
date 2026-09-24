"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PlatformCard } from "@/components/system/PlatformCard";
import { VerticalCard } from "@/components/system/VerticalCard";
import { CTASection } from "@/components/system/CTASection";
import { ProductStatus } from "@/components/system/ProductStatus";
import { PLATFORM_OS } from "@/lib/product-ia";
import { VERTICALS } from "@/lib/content/verticals";
import { PRICING_PLANS, PRICING_NOTES, OS_AVAILABILITY } from "@/lib/content/pricing";
import { VERTICAL_AVAILABILITY } from "@/lib/content/leads";
import { CommercePreview } from "@/components/home/previews/CommercePreview";
import { LogisticsPreview } from "@/components/home/previews/LogisticsPreview";
import { MarketingPreview } from "@/components/home/previews/MarketingPreview";
import { BuildPreview } from "@/components/home/previews/BuildPreview";
import { RinpoSection } from "@/components/home/RinpoSection";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { trackMarketing } from "@/lib/analytics";

const OUTCOME_CARDS = [
  {
    title: "Run the business",
    description: "Customers, work, money, and operations on one foundation.",
    href: "/platform/business-os",
  },
  {
    title: "Grow revenue",
    description: "Marketing, campaigns, and customer growth connected to CRM.",
    href: "/platform/marketing-os",
  },
  {
    title: "Automate operations",
    description: "Workflows with permissions, approvals, and auditability.",
    href: "/platform/automation-os",
  },
  {
    title: "Build software",
    description: "Structured delivery from requirement to shipped systems.",
    href: "/platform/build-os",
  },
  {
    title: "Operate commerce",
    description: "Catalogue, orders, payments, and fulfilment together.",
    href: "/platform/commerce-os",
  },
  {
    title: "Train the team",
    description: "Learn through real work on Academy programmes.",
    href: "/academy",
  },
] as const;

const CONNECTED_WORKFLOW = [
  "Lead received",
  "Customer context",
  "Proposal / project",
  "Invoice / payment",
  "Campaign / order",
  "Shipment",
  "RINPO next action",
] as const;

const TRUST_ITEMS = [
  {
    title: "Organisation context",
    description: "Business data and product access resolve through organisation context — not a shared global workspace.",
  },
  {
    title: "Permissions",
    description: "RINPO and product workflows are designed to respect the same authorization boundaries as the operating system.",
  },
  {
    title: "Approval gates",
    description: "Sensitive or meaningful actions can be held for review instead of treating AI output as automatic authority.",
  },
  {
    title: "Auditability",
    description: "Important system activity can remain traceable through event and audit primitives.",
  },
  {
    title: "Human control",
    description: "Recommendations prepare work; execution of supported actions still requires the right permissions.",
  },
] as const;

const RINPO_STEPS = [
  "Ask",
  "Understand",
  "Draft",
  "Recommend",
  "Prepare action",
  "Request approval",
  "Execute supported actions",
] as const;

function DemoWorkspace() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section id="platform-demo" className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Sparkles size={14} className="text-rinads-primary" aria-hidden />
            Demo workspace · sample data
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            See the operating platform in motion.
          </h2>
          <p className="mt-5 text-[var(--text-muted)]">
            This demonstration uses fictional values to show how business state and RINPO guidance appear together. It is not customer performance data.
          </p>

          <ol className="mt-6 space-y-2">
            {CONNECTED_WORKFLOW.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rinads-primary/15 text-[10px] font-bold text-rinads-primary">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              trackMarketing("rinpo_demo_started", { source: "home_demo" });
              openPhoneScreen("chat", "Show me what needs attention in this demo business workspace.");
            }}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            Try the RINPO demo
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">Business OS</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Demo workspace</p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
              Sample data
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
  const primaryOs = OS_AVAILABILITY.filter((os) => os.commercialPriority === "primary");
  const secondaryOs = OS_AVAILABILITY.filter((os) => os.commercialPriority === "secondary");
  const commercialVerticals = VERTICALS.filter((v) =>
    VERTICAL_AVAILABILITY.find((a) => a.slug === v.slug)?.tier === "commercial",
  );
  const futureVerticals = VERTICALS.filter((v) =>
    VERTICAL_AVAILABILITY.find((a) => a.slug === v.slug)?.tier === "future",
  );

  return (
    <>
      <DemoWorkspace />

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Business outcomes</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            What RINADS helps your team do.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
            Start from the outcome. Each path maps to a real product or service destination.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OUTCOME_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                onClick={() => trackMarketing("product_explored", { href: card.href })}
                className="group min-h-[160px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-rinads-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{card.title}</h3>
                  <ArrowRight size={16} className="text-[var(--text-muted)] transition group-hover:text-rinads-primary" aria-hidden />
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <Bot className="mt-1 text-rinads-primary" size={24} aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">RINPO</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                The persistent AI interface across RINADS.
              </h2>
              <p className="mt-4 max-w-2xl text-white/60">
                RINPO helps teams understand what needs attention, prepare the next step, and move supported actions through the right permissions and approvals. Recommendations never imply automatic permission to execute.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {RINPO_STEPS.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-rinads-primary/35 bg-rinads-primary/[0.08] px-3 py-1.5 text-xs font-semibold text-rinads-primary">
                  {step}
                </span>
                {index < RINPO_STEPS.length - 1 ? (
                  <ArrowRight size={13} className="text-white/35" aria-hidden />
                ) : null}
              </span>
            ))}
          </div>
          <Link href="/rinpo" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline">
            See how RINPO works
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <RinpoSection />

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Connected operating systems</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Start with the systems teams use first.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
            Commercially usable products first. Additional operating systems expand the platform without forcing visitors to learn eight equal concepts at once.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {primaryOs.map((os) => (
              <div key={os.href} className="space-y-3">
                <PlatformCard
                  title={os.name}
                  description={PLATFORM_OS.find((item) => item.href === os.href)?.description ?? ""}
                  href={os.href}
                  eyebrow="Primary"
                />
                <ProductStatus status={os.status} />
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryOs.map((os) => (
              <div key={os.href} className="space-y-2">
                <PlatformCard
                  title={os.name}
                  description={PLATFORM_OS.find((item) => item.href === os.href)?.description ?? ""}
                  href={os.href}
                  eyebrow="Also on the platform"
                />
                <ProductStatus status={os.status} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Industry configurations</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            One RINADS core. Configured for the industry.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
            Commercial configurations first. Future and private-preview verticals are labelled separately.
          </p>

          <h3 className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Commercial focus</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {commercialVerticals.map((vertical) => {
              const availability = VERTICAL_AVAILABILITY.find((item) => item.slug === vertical.slug);
              return (
                <VerticalCard
                  key={vertical.slug}
                  name={vertical.slug === "nursery" ? "Landscape & Nursery" : vertical.name}
                  type={vertical.type}
                  summary={vertical.summary}
                  href={`/solutions/${vertical.slug}`}
                  status={availability?.status ?? "coming_soon"}
                />
              );
            })}
          </div>

          <h3 className="mt-12 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Future / private preview
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {futureVerticals.map((vertical) => {
              const availability = VERTICAL_AVAILABILITY.find((item) => item.slug === vertical.slug);
              return (
                <VerticalCard
                  key={vertical.slug}
                  name={vertical.name}
                  type={vertical.type}
                  summary={vertical.summary}
                  href={`/solutions/${vertical.slug}`}
                  status={availability?.status ?? "coming_soon"}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-rinads-primary" size={24} aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Governance</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                AI that operates inside business controls.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <Link href="/security" className="mt-7 inline-block text-sm font-semibold text-rinads-primary hover:underline">
            View security →
          </Link>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Customer proof</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Stories published only with approval.
          </h2>
          <p className="mt-4 max-w-2xl text-white/60">
            Customer logos and verified metrics appear only when permission and measurement are confirmed. Until then, explore the product surfaces below — labelled as demos where appropriate.
          </p>
          <Link
            href="/customers"
            className="mt-6 inline-flex text-sm font-semibold text-rinads-primary hover:underline"
            onClick={() => trackMarketing("case_study_viewed", { source: "home" })}
          >
            View customers →
          </Link>

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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Pricing preview</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Clear packaging. Commercial prices when approved.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--text-muted)]">{PRICING_NOTES.softwareVsServices}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`rounded-2xl border p-5 ${
                  plan.featured
                    ? "border-rinads-primary/50 bg-rinads-primary/[0.06]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{plan.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-rinads-primary">
                  {typeof plan.monthlyPrice === "number" ? `From ${plan.monthlyPrice}` : plan.monthlyPrice === "contact" ? "Contact sales" : "Coming soon"}
                </p>
              </article>
            ))}
          </div>
          <Link href="/pricing" className="mt-8 inline-block text-sm font-semibold text-rinads-primary hover:underline">
            View pricing →
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--border)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 text-rinads-primary" size={24} aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Implementation</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Self-configure where appropriate — or implement with RINADS Services.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
                Some organisations can configure RINADS directly. Migration, integrations, custom workflows, and complex cutovers are delivered through RINADS Services and priced separately from software subscription.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-rinads-primary/50"
                >
                  Explore services
                </Link>
                <Link
                  href="/contact?intent=implementation"
                  className="rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-rinads-primary-dark"
                >
                  Talk to an implementation specialist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        headline="Book a platform demo."
        summary="See how RINADS connects customers, work, commerce, marketing and automation — with RINPO helping your team move approved work forward."
      />
    </>
  );
}
