"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DEMO_COMPANIES,
  DEMO_PROJECTS,
  DEMO_TASKS,
  computeClientHealth,
} from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

const TABS = [
  "Overview",
  "Contacts",
  "Projects",
  "Tasks",
  "Approvals",
  "Invoices",
  "Communication",
  "RINPO",
] as const;

type TabId = (typeof TABS)[number];

function sampleHealth(companyId: string) {
  if (companyId === "co-apex") {
    return computeClientHealth({
      overdueInvoiceCount: 1,
      openProjectAtRiskCount: 1,
      pendingApprovalCount: 1,
    });
  }
  return computeClientHealth({
    openProjectAtRiskCount: 0,
    engagementScore01: 0.82,
    daysToRenewal: 120,
  });
}

export function CompanyCustomerDetail({ clientId }: { clientId: string }) {
  const company = DEMO_COMPANIES.find((c) => c.id === clientId);
  const [tab, setTab] = useState<TabId>("Overview");

  const projects = useMemo(
    () => DEMO_PROJECTS.filter((p) => p.companyId === clientId),
    [clientId],
  );
  const projectIds = new Set(projects.map((p) => p.id));
  const tasks = useMemo(
    () => DEMO_TASKS.filter((t) => t.projectId && projectIds.has(t.projectId)),
    [projectIds],
  );

  if (!company) {
    return (
      <div className="px-4 py-8">
        <CompanyOsPanel title="Customer not found">
          <Link href="/os/customers" className="text-sm text-rinads-primary underline">
            Back to customers
          </Link>
        </CompanyOsPanel>
      </div>
    );
  }

  const health = sampleHealth(clientId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <Link href="/os/customers" className="text-sm text-rinads-primary underline">
          ← Customers
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{company.name}</h1>
        <CompanyOsDemoNotice />
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Customer sections">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-2xl px-3 py-2 text-sm font-medium ${
              tab === t ? "bg-black text-white" : "os-glass text-gray-800"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Overview" && (
        <CompanyOsPanel title="Overview">
          <p className="text-sm text-gray-700">{company.healthNotes}</p>
          {health && (
            <div className="mt-4 rounded-2xl bg-white/50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                Health score {health.score} ({health.band}) — sample signals
              </p>
              <p className="mt-1 text-xs text-gray-600">{health.formula}</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-700">
                {health.components.map((c) => (
                  <li key={c.key}>
                    {c.key}: {c.note} (weight {c.weight})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CompanyOsPanel>
      )}

      {tab === "Projects" && (
        <CompanyOsPanel title="Projects">
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id} className="rounded-xl bg-white/60 px-3 py-2 text-sm">
                <span className="font-semibold">{p.name}</span> — {p.status} · {p.health}
              </li>
            ))}
          </ul>
        </CompanyOsPanel>
      )}

      {tab === "Tasks" && (
        <CompanyOsPanel title="Tasks">
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="rounded-xl bg-white/60 px-3 py-2 text-sm">
                {t.title} — {t.status}
              </li>
            ))}
          </ul>
        </CompanyOsPanel>
      )}

      {tab !== "Overview" && tab !== "Projects" && tab !== "Tasks" && (
        <CompanyOsPanel title={tab}>
          <p className="text-sm text-gray-700">
            No live {tab.toLowerCase()} data in Phase 1. Connect CRM, billing, and comms modules in
            later phases — this tab is an honest empty state.
          </p>
        </CompanyOsPanel>
      )}
    </div>
  );
}
