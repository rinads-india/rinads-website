"use client";

import Link from "next/link";
import { DEMO_COMPANIES, computeClientHealth } from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";

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

function bandClass(band: string) {
  switch (band) {
    case "healthy":
      return "bg-emerald-100 text-emerald-900";
    case "watch":
      return "bg-amber-100 text-amber-900";
    case "at_risk":
      return "bg-orange-100 text-orange-900";
    default:
      return "bg-red-100 text-red-900";
  }
}

export function CompanyCustomersList() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <CompanyOsDemoNotice />
      </header>
      <ul className="space-y-3">
        {DEMO_COMPANIES.map((company) => {
          const health = sampleHealth(company.id);
          return (
            <li key={company.id}>
              <Link href={`/os/customers/${company.id}`} className="block">
                <CompanyOsPanel className="transition hover:bg-white/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-600">
                        {company.industry} · {company.lifecycleStage}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{company.healthNotes}</p>
                    </div>
                    {health && (
                      <div className="text-right">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${bandClass(health.band)}`}
                        >
                          {health.band.replace("_", " ")} · sample
                        </span>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{health.score}</p>
                      </div>
                    )}
                  </div>
                </CompanyOsPanel>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
