"use client";

import { useState } from "react";
import { demoApprovalInbox } from "@rinads/company-os";
import type { CosApprovalStatus } from "@rinads/company-os";
import { CompanyOsDemoNotice, CompanyOsPanel } from "@/components/os/company/CompanyOsPanel";
import { formatInrAmount } from "@/lib/company-os-display";

type LocalStatus = CosApprovalStatus | "awaiting_approval";

export function CompanyApprovalsInbox() {
  const items = demoApprovalInbox();
  const [statusById, setStatusById] = useState<Record<string, LocalStatus>>({});
  const [toast, setToast] = useState<string | null>(null);

  const act = (id: string, status: LocalStatus, label: string) => {
    setStatusById((prev) => ({ ...prev, [id]: status }));
    setToast(`${label} recorded locally (demo UI only — not saved).`);
    window.setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
        <CompanyOsDemoNotice />
      </header>
      {toast && (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {toast}
        </p>
      )}
      <ul className="space-y-3">
        {items.map((item) => {
          const local = statusById[item.id] ?? item.status;
          return (
            <li key={item.id}>
              <CompanyOsPanel>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.requesterLabel} · risk {item.risk}
                      {item.financialImpact != null &&
                        ` · ${formatInrAmount(item.financialImpact, item.currency)}`}
                    </p>
                    <p className="mt-2 text-xs text-gray-700">RINPO: {item.rinpoRecommendation}</p>
                    <p className="mt-2 text-xs font-medium uppercase text-gray-500">Status: {local}</p>
                  </div>
                  {local === "awaiting_approval" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="min-h-11 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
                        onClick={() => act(item.id, "approved", "Approve")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white"
                        onClick={() => act(item.id, "rejected", "Reject")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white"
                        onClick={() => act(item.id, "changes_requested", "Request changes")}
                      >
                        Request changes
                      </button>
                    </div>
                  )}
                </div>
              </CompanyOsPanel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
