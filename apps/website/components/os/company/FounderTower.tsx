"use client";

import Link from "next/link";
import { DEMO_ATTENTION, demoCompanyPulse } from "@rinads/company-os";
import { useOsOrgRole } from "@/components/os/OsOrgRoleProvider";
import { canAccessFounderTower } from "@/lib/company-os-mode";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";
import { buildPulseMetricRows } from "@/lib/company-os-display";

const SEVERITY_ORDER = ["P0", "P1", "P2", "P3"] as const;

export function FounderTower() {
  const { roleKey } = useOsOrgRole();
  const allowed = canAccessFounderTower(roleKey);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <CompanyOsPanel title="Founder Tower">
          <p className="text-sm text-gray-800" role="status">
            You do not have access to Founder Tower. Admin, founder, or super admin roles are
            required.
          </p>
        </CompanyOsPanel>
      </div>
    );
  }

  const pulse = demoCompanyPulse();
  const metrics = buildPulseMetricRows(pulse);
  const attention = [...DEMO_ATTENTION].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Founder Tower</h1>
        <CompanyOsDemoNotice />
      </header>

      <CompanyOsPanel title="Company pulse">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((row) => (
            <div
              key={row.key}
              className={`rounded-2xl px-3 py-3 ${row.unavailable ? "bg-gray-100/80" : "bg-white/60"}`}
            >
              <p className="text-xs font-medium text-gray-600">{row.label}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {row.unavailable ? "Unavailable" : row.value}
              </p>
              {row.unavailable && (
                <p className="mt-1 text-[11px] text-gray-500">Not connected to live finance yet.</p>
              )}
            </div>
          ))}
        </div>
      </CompanyOsPanel>

      <CompanyOsPanel title="Founder attention" description="P0–P3 sample queue.">
        <ul className="space-y-2">
          {attention.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-2xl bg-white/50 px-3 py-3"
            >
              <div>
                <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">
                  {item.severity}
                </span>
                <p className="mt-1 text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-600">{item.summary}</p>
              </div>
              {item.href && (
                <Link
                  href={item.href}
                  className="min-h-11 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white"
                >
                  Open
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CompanyOsPanel>
    </div>
  );
}
