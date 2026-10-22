import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "R GLOW — Salon Operating System by RINADS",
  description:
    "Run salon bookings, customers, staff, POS, loyalty, reviews and growth workflows with R GLOW and RINPO.",
  robots: { index: true, follow: true },
};

const operatingCapabilities = [
  {
    title: "Bookings & Calendar",
    description: "Public and front-desk booking, availability, rescheduling, status changes and conflict protection.",
  },
  {
    title: "Clients & Loyalty",
    description: "Customer history, spend, notes, loyalty, reviews and recovery workflows in one tenant-safe workspace.",
  },
  {
    title: "Staff & Branches",
    description: "Branch-scoped teams, services, specialties, working hours and multi-branch operating context.",
  },
  {
    title: "POS & Payments",
    description: "Controlled-pilot POS with services, tax calculation, payment-method recording, refunds and loyalty redemption.",
  },
  {
    title: "Growth Workflows",
    description: "Campaign, review, loyalty and reactivation workflows with consent-aware communication controls.",
  },
  {
    title: "RINPO",
    description: "Tenant-aware salon assistance with deterministic tools and approval-gated operational actions.",
  },
] as const;

const plannedCapabilities = [
  "Inventory and stock transfer",
  "Digital Store and customer commerce",
  "Staff phone experience",
  "Voice receptionist and expanded RINPO Phone",
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f7f5]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-black text-sm font-black text-white">R</span>
            <span>R GLOW</span>
            <span className="hidden text-xs font-medium text-black/45 sm:inline">by RINADS</span>
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="https://www.rinads.com/contact"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-black/70 transition hover:bg-black/5 sm:inline-flex"
            >
              Book demo
            </a>
            <Link
              href="/login?next=/calendar"
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black/60">
              Salon Operating System
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Run the salon.
              <br />
              RINPO helps with the rest.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-black/60 sm:text-xl">
              R GLOW brings bookings, customers, staff, branch operations, POS, loyalty, reviews and governed salon intelligence into one RINADS workspace.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="https://www.rinads.com/contact"
                className="rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/85"
              >
                Book an R GLOW demo
              </a>
              <Link
                href="/login?next=/calendar"
                className="rounded-full border border-black/15 bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:border-black/30"
              >
                Owner & staff sign in
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-black p-6 text-white shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">R GLOW workspace</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">Today at a glance</p>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">Controlled pilot</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Appointments", "Booking + calendar"],
                ["Clients", "History + loyalty"],
                ["Team", "Staff + branches"],
                ["RINPO", "Assist + approve"],
              ].map(([title, subtitle]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-white/45">{subtitle}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
              <p className="text-sm font-semibold">RINPO</p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Uses the active salon tenant context and keeps write actions behind explicit operational controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Operate</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">One salon workspace, less operational fragmentation.</h2>
            <p className="mt-4 text-base leading-7 text-black/55">
              R GLOW is built on the shared RINADS identity, tenancy, permissions, runtime and audit foundation rather than a separate salon-only account system.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {operatingCapabilities.map((capability) => (
              <article key={capability.title} className="rounded-3xl border border-black/10 bg-[#fbfbfa] p-6">
                <h3 className="text-lg font-semibold tracking-tight">{capability.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/55">{capability.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-black/10 bg-white p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Available in the controlled-pilot product</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Start with the workflows salons use every day.</h2>
            <p className="mt-4 text-sm leading-7 text-black/55">
              Authentication, tenant isolation, branches, services, staff, booking, client history, calendar operations, basic POS, loyalty, reviews and the first RINPO salon tools are implemented in the canonical platform.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[#ecece7] p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Expansion roadmap</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Grow without pretending planned features are already live.</h2>
            <div className="mt-6 space-y-3">
              {plannedCapabilities.map((item) => (
                <div key={item} className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 px-4 py-3">
                  <span className="text-sm font-medium">{item}</span>
                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/45">Planned</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">R GLOW × RINADS</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Your salon becomes one connected RINADS workspace.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">
            Start with salon operations. Expand later into growth, commerce, communication, creative services and digital experiences through the same business identity.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="https://www.rinads.com/contact" className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black">
              Talk to RINADS
            </a>
            <a href="https://www.rinads.com" className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white">
              Explore RINADS
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
