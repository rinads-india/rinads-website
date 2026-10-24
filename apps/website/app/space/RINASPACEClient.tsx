"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EntitlementState } from "@rinads/tenancy";
import { setActiveOrganizationAction } from "@/lib/org-context";
import {
  getRinaSpaceSectionsForContext,
  type RinaSpaceCapabilityStatus,
} from "@/lib/rinaspace-capabilities";

type MembershipOption = {
  organizationId: string;
  organizationName: string;
  roleKey: string;
};

type Props = {
  riIdentity: string;
  role: string;
  orgName: string;
  activeOrganizationId: string;
  memberships: MembershipOption[];
  planKey?: string;
  verticalKey?: string;
  entitlementState: EntitlementState;
  entitlementEndsAt?: string;
  featureFlags?: Record<string, boolean>;
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

const ENTITLEMENT_LABEL: Record<EntitlementState, string> = {
  paid_active: "Paid · Active",
  trialing: "7-day trial · Active",
  expiring: "Trial · Expiring",
  expired_read_only: "Trial expired · Read only",
  none: "Activation required",
};

const PLATFORM_PATH = [
  "RI ID ♾️",
  "RINASPACE",
  "Business Graph",
  "Industry Pack",
  "RINADS INTELLIGENCE",
  "RINPO",
  "RINPO Runtime",
  "Connectors",
  "Audit",
] as const;

function formatEndsAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function RINASPACEClient({
  riIdentity,
  role,
  orgName,
  activeOrganizationId,
  memberships,
  planKey,
  verticalKey,
  entitlementState,
  entitlementEndsAt,
  featureFlags,
}: Props) {
  const router = useRouter();
  const [isSwitching, startSwitch] = useTransition();
  const [switchError, setSwitchError] = useState<string | null>(null);
  const sections = getRinaSpaceSectionsForContext({ role, planKey, verticalKey, featureFlags });
  const liveCount = sections.reduce(
    (count, section) => count + section.capabilities.filter((capability) => capability.status === "live").length,
    0,
  );
  const previewCount = sections.reduce(
    (count, section) => count + section.capabilities.filter((capability) => capability.status === "preview").length,
    0,
  );
  const entitlementEndLabel = formatEndsAt(entitlementEndsAt);
  const isReadOnly = entitlementState === "expired_read_only" || entitlementState === "none";

  function switchOrganization(organizationId: string) {
    if (!organizationId || organizationId === activeOrganizationId) return;
    setSwitchError(null);
    startSwitch(async () => {
      const result = await setActiveOrganizationAction(organizationId);
      if (!result.ok) {
        setSwitchError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">RINADS / RINASPACE</p>
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200">MVP ♾️</span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Your business intelligence workspace.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              One RI ID connects your organization, industry pack, RINADS Intelligence, RINPO Runtime and governed connectors. Every executable action remains permissioned and auditable.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 px-3 py-1.5">RI ID ♾️ · {riIdentity}</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">{orgName}</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 capitalize">{role}</span>
              {planKey ? <span className="rounded-full border border-white/15 px-3 py-1.5">Plan: {planKey}</span> : null}
              {verticalKey ? <span className="rounded-full border border-white/15 px-3 py-1.5">Pack: {verticalKey}</span> : null}
              <span className="rounded-full border border-white/15 px-3 py-1.5">{liveCount} live</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">{previewCount} preview</span>
            </div>
          </div>

          <div className="space-y-3 lg:w-[25rem]">
            {memberships.length > 1 ? (
              <div>
                <label htmlFor="rinaspace-org" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                  Active organization
                </label>
                <select
                  id="rinaspace-org"
                  value={activeOrganizationId}
                  disabled={isSwitching}
                  onChange={(event) => switchOrganization(event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none disabled:opacity-60"
                >
                  {memberships.map((membership) => (
                    <option key={membership.organizationId} value={membership.organizationId} className="text-black">
                      {membership.organizationName} · {membership.roleKey}
                    </option>
                  ))}
                </select>
                {switchError ? <p className="mt-1.5 text-xs text-red-300">{switchError}</p> : null}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href="/os"
                aria-disabled={isReadOnly}
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
        </div>
      </section>

      <section className={`mt-4 rounded-2xl border p-4 sm:p-5 ${isReadOnly ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Entitlement</p>
            <p className="mt-1 font-semibold text-gray-950">{ENTITLEMENT_LABEL[entitlementState]}</p>
          </div>
          {entitlementEndLabel ? <p className="text-sm text-gray-600">Ends {entitlementEndLabel}</p> : null}
        </div>
        {entitlementState === "none" ? (
          <p className="mt-2 text-sm leading-5 text-gray-700">No paid or governed trial entitlement is active. Capabilities remain fail-closed until activation.</p>
        ) : null}
        {entitlementState === "expired_read_only" ? (
          <p className="mt-2 text-sm leading-5 text-gray-700">Your trial has ended. Identity and workspace context remain visible while executable modules stay locked.</p>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Platform contract</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-950">One identity → governed execution</h2>
          </div>
          <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Locked</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PLATFORM_PATH.map((item, index) => (
            <div key={item} className="flex shrink-0 items-center gap-2">
              <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800">{item}</span>
              {index < PLATFORM_PATH.length - 1 ? <span className="text-gray-300">→</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Identity</p>
          <p className="mt-2 font-semibold text-gray-950">RI ID ♾️</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">A single authenticated identity can participate in multiple organizations without creating separate product logins.</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Entitlements</p>
          <p className="mt-2 font-semibold text-gray-950">Plan + pack + policy</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">Paid and governed trial state is resolved server-side before modules and feature flags are exposed.</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Intelligence</p>
          <p className="mt-2 font-semibold text-gray-950">RINPO Runtime</p>
          <p className="mt-1 text-sm leading-5 text-gray-600">RINADS Intelligence reasons; RINPO Runtime executes through authorized connectors and records the result.</p>
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

      <section className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Governance</p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">Observe → Understand → Recommend → Authorize → Act → Audit.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
          RINASPACE is the experience layer, not the security boundary. Supabase RLS, server-side permissions, entitlement resolution and RINPO Runtime policy remain authoritative for every tenant-scoped action.
        </p>
      </section>
    </main>
  );
}
