"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { ProductStatus } from "@/components/system/ProductStatus";
import type { VerticalContent } from "@/lib/content/types";
import { getVerticalAvailability } from "@/lib/content/leads";
import {
  getSolutionExperience,
  type SolutionExperienceConfig,
  type SolutionExperienceKey,
} from "@/lib/solution-experience";

function StatusBadge({ vertical }: { vertical: VerticalContent }) {
  const availability = getVerticalAvailability(vertical.slug);
  return <ProductStatus status={availability.status} />;
}

function RetailDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-4">
        {[
          ["248", "Products"],
          ["17", "Low-stock items"],
          ["36", "Open orders"],
          ["128", "CRM customers"],
        ].map(([value, label]) => (
          <div key={label} className="bg-[var(--surface)] p-5">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Retail operations</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Catalogue", "Products, variants, collections"],
              ["Inventory", "Availability and stock state"],
              ["Orders", "Payment and fulfilment state"],
              ["Customers", "CRM, loyalty, and growth"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black p-5 text-white">
          <Store size={22} className="text-rinads-primary" aria-hidden />
          <p className="mt-4 text-lg font-semibold">One retail state across selling and operations.</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            The demo connects catalogue, stock, order state, customers, and growth instead of treating each as a separate app.
          </p>
        </div>
      </div>
    </div>
  );
}

function NurseryDemo() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="grid gap-3 lg:grid-cols-3">
        {[
          ["Inventory", "Pebbles, plants, pots, materials"],
          ["Projects", "Quotes, site work, milestones"],
          ["Fulfilment", "Order, loading, delivery, follow-up"],
        ].map(([title, detail], index) => (
          <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold text-rinads-primary">{String(index + 1).padStart(2, "0")}</p>
            <h3 className="mt-3 text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{detail}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO example</p>
        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
          Two project materials are low relative to the next scheduled field-work window.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Synthetic demonstration only.</p>
      </div>
    </div>
  );
}

function SalonDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/rglow-logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rinads-primary">R GLOW · Salon OS</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Owner & staff operating loop</p>
          </div>
        </div>
        <CheckCircle2 size={20} className="text-[var(--status-success-fg)]" aria-hidden />
      </div>

      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-4">
        {[
          ["Calendar", "Bookings"],
          ["POS", "Sales"],
          ["Clients", "CRM"],
          ["Growth", "Campaigns"],
        ].map(([title, detail]) => (
          <div key={title} className="bg-[var(--surface)] p-5">
            <p className="text-lg font-bold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Built journeys</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "Appointments",
              "Services & staff",
              "POS & refunds",
              "Client notes",
              "Loyalty",
              "Campaigns",
              "Communications",
              "Reviews & recovery",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-3">
                <CheckCircle2 size={15} className="shrink-0 text-rinads-primary" aria-hidden />
                <span className="text-sm text-[var(--text-primary)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden bg-black p-5 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/rinpo-face.png"
            alt=""
            width={96}
            height={96}
            className="absolute -right-2 -top-2 h-24 w-24 rounded-full object-cover opacity-40"
            aria-hidden
          />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">RINPO in R GLOW</p>
          <p className="mt-4 text-lg font-semibold">Salon attention and action context.</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Product-side salon tools reuse salon data, permission checks, approvals, and audit paths instead of creating a
            separate intelligence stack.
          </p>
        </div>
      </div>
    </div>
  );
}

function JewelleryDemo() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-black p-5 text-white">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Collection", "Merchandising"],
          ["Product Studio", "High-detail media"],
          ["Appointment", "Assisted buying"],
          ["Fulfilment", "High-trust handoff"],
        ].map(([title, detail], index) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-rinads-primary">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-white/45">{detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Concept boundary</p>
        <p className="mt-2 text-sm leading-6 text-white/60">
          This is a coming-soon vertical configuration preview, not a claim that a production jewellery OS is currently available.
        </p>
      </div>
    </div>
  );
}

function LogisticsDemo() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Vertical concept</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Provider-neutral logistics operations</p>
        </div>
        <Truck size={22} className="text-rinads-primary" aria-hidden />
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {[
            ["Shipment intake", "Ready"],
            ["Carrier assignment", "Planned"],
            ["Tracking state", "Planned"],
            ["Exception desk", "Planned"],
            ["Returns", "Planned"],
          ].map(([title, state]) => (
            <div key={title} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
              <span className="text-xs text-[var(--text-muted)]">{state}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
          Logistics OS product primitives are shown elsewhere in the platform; this vertical page describes the planned business configuration around them.
        </p>
      </div>
    </div>
  );
}

function HealthcareDemo() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-3">
        <ShieldCheck size={22} className="text-rinads-primary" aria-hidden />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">Non-clinical operations concept</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Scheduling and practice workflow only</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Scheduling", CalendarDays],
          ["Team workflow", Users],
          ["Follow-up queue", CircleDot],
        ].map(([title, Icon]) => {
          const IconComponent = Icon as typeof CalendarDays;
          return (
            <div key={String(title)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <IconComponent size={18} className="text-rinads-primary" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{String(title)}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">
        This coming-soon concept is intentionally limited to practice operations. It does not claim diagnosis, treatment recommendations, clinical decision support, or healthcare compliance certification.
      </p>
    </div>
  );
}

const DEMOS: Record<SolutionExperienceKey, ComponentType> = {
  retail: RetailDemo,
  nursery: NurseryDemo,
  salon: SalonDemo,
  jewellery: JewelleryDemo,
  logistics: LogisticsDemo,
  healthcare: HealthcareDemo,
};

export function VerticalSolutionExperience({ vertical }: { vertical: VerticalContent }) {
  const { openPhoneScreen } = useRinpo();
  const config = getSolutionExperience(vertical.slug);

  if (!config) return null;

  const Demo = DEMOS[config.slug];
  const isSalon = config.slug === "salon";

  return (
    <>
      <section className="px-6 pb-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge vertical={vertical} />
            <span className="text-xs text-[var(--text-muted)]">{config.statusNote}</span>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Shared RINADS core</p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                This vertical is configured from existing RINADS platform layers rather than becoming a separate technology stack.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {config.foundation.map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                <Sparkles size={14} className="text-rinads-primary" aria-hidden />
                {config.demoLabel}
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                {config.signature}
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">{config.demoSummary}</p>
            </div>
            {vertical.status !== "available" ? (
              <p className="max-w-sm text-xs leading-5 text-[var(--text-muted)]">
                This page is a product-direction preview. Coming-soon visuals do not imply production availability.
              </p>
            ) : getVerticalAvailability(vertical.slug).status === "prototype_demo" ? (
              <p className="max-w-sm text-xs leading-5 text-[var(--text-muted)]">
                Demo / sample configuration — not a claim that a production vertical is generally available.
              </p>
            ) : null}
          </div>

          <div className="mt-10">
            <Demo />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Industry workflow</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            Configure the platform around how this business actually works.
          </h2>
          <div className="mt-10 overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center">
              {config.workflow.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                    {step}
                  </span>
                  {index < config.workflow.length - 1 ? (
                    <ArrowRight size={16} className="mx-2 text-rinads-primary/60" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINPO for {config.publicName}</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              One RINPO. Context changes with the business.
            </h2>
            <p className="mt-5 text-white/60">
              RINPO can explain this vertical, guide the workflow, and route toward supported platform actions without creating a separate intelligence architecture for the industry.
            </p>
            <button
              type="button"
              onClick={() => openPhoneScreen("chat", config.rinpoPrompt)}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ask RINPO
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Configuration model</p>
            <div className="mt-5 space-y-3">
              {[
                ["Shared platform", "Identity, tenancy, permissions, data, runtime"],
                ["Operating Systems", config.foundation.join(" · ")],
                ["Industry workflow", config.workflow.join(" → ")],
                ["RINPO", "Same interface, vertical context"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isSalon ? (
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl rounded-3xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">Try R GLOW</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
              Explore the customer booking entry or start a salon workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              R GLOW product code is built, while production cutover still depends on deployment, credentials, and operational validation. Live booking links are organization-specific.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/solutions/salon/book"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
              >
                View booking entry
                <ArrowRight size={15} aria-hidden />
              </Link>
              <Link
                href="/contact?intent=demo"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/45"
              >
                Book a platform demo
              </Link>
              <Link
                href="/signup?mode=login"
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-rinads-primary"
              >
                Existing salon sign in
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
