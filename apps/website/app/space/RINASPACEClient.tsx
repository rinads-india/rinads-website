"use client";

import Link from "next/link";
import { getRinaSpaceSectionsForRole, type RinaSpaceCapabilityStatus } from "@/lib/rinaspace-capabilities";

type Props = {
  role: string;
  orgName: string;
};

const STATUS_BADGE: Record<RinaSpaceCapabilityStatus, string> = {
  live: "bg-emerald-100 text-emerald-800",
  preview: "bg-amber-100 text-amber-900",
  soon: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<RinaSpaceCapabilityStatus, string> = {
  live: "Live",
  preview: "Preview",
  soon: "Soon",
};

export function RINASPACEClient({ role, orgName }: Props) {
  const sections = getRinaSpaceSectionsForRole(role);
  const liveCount = sections.reduce(
    (count, section) => count + section.capabilities.filter((capability) => capability.status === "live").length,
    0,
  );
  const previewCount = sections.reduce(
    (count, section) => count + section.capabilities.filter((capability) => capability.status === "preview").length,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-black p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">RINADS / SPACE</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Your business. Your work. Your AI.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              RINASPACE is the authenticated workspace for your RINADS capabilities. Open what you are entitled to use without switching identity, tenant or operating context.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 px-3 py-1.5">{orgName}</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 capitalize">{role}</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">{liveCount} live</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">{previewCount} preview</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[23rem]">
            <Link
              href="/os"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Open Business OS
            </Link>
            <Link
              href="/phone"
              className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open RINPO Phone
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Identity</p>
          <p className="mt-2 font-semibold text-gray-950">One RINADS sign-in</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">Organization, role and capability context follow you across the workspace.</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Intelligence</p>
          <p className="mt-2 font-semibold text-gray-950">RINPO across the platform</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">RINADS Intelligence reasons; RINPO Runtime executes governed work.</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Workspace</p>
          <p className="mt-2 font-semibold text-gray-950">Capabilities, not silos</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">Run, Grow, Sell, Create, Build, Learn and Experience from one workspace.</p>
        </article>
      </section>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`rinaspace-${section.id}`}>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id={`rinaspace-${section.id}`} className="text-2xl font-semibold tracking-tight text-gray-950">
                  {section.label}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{section.description}</p>
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                {section.capabilities.length} {section.capabilities.length === 1 ? "capability" : "capabilities"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.capabilities.map((capability) => (
                <Link
                  key={capability.id}
                  href={capability.href}
                  className="group block rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <p className="font-semibold text-gray-950">{capability.label}</p>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[capability.status]}`}>
                      {STATUS_LABEL[capability.status]}
                    </span>
                  </div>
                  <p className="text-sm leading-5 text-gray-600">{capability.description}</p>
                  <p className="mt-4 text-xs font-semibold text-gray-950 opacity-60 transition group-hover:opacity-100">Open →</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Wave 0 foundation</p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">Role filtering is active. Entitlement filtering is next.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
          This workspace now uses one canonical capability registry and avoids links to routes that do not exist. The next migration replaces role-only visibility with plan, tenant and industry-pack entitlements while preserving the same RINASPACE shell.
        </p>
      </section>
    </main>
  );
}
