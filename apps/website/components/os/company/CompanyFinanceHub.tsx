"use client";

import { demoFinanceSummary } from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";
import { buildFinanceMetricRows } from "@/lib/company-os-display";

export function CompanyFinanceHub() {
  const summary = demoFinanceSummary();
  const rows = buildFinanceMetricRows(summary);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Finance</h1>
        <CompanyOsDemoNotice />
      </header>
      <CompanyOsPanel title="Summary">
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className={`rounded-2xl px-3 py-3 ${row.unavailable ? "bg-gray-100/80" : "bg-white/60"}`}
            >
              <p className="text-xs text-gray-600">{row.label}</p>
              <p className="text-lg font-semibold text-gray-900">{row.value}</p>
            </div>
          ))}
        </div>
      </CompanyOsPanel>
    </div>
  );
}
