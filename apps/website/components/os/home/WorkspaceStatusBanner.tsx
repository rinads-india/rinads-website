"use client";

import { useId, useState } from "react";
import type { WorkspaceStatusData } from "@/lib/os-home/types";

export function WorkspaceStatusBanner({ workspace }: { workspace: WorkspaceStatusData }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const isDemo = workspace.mode === "demo";

  return (
    <>
      <section
        aria-label="Workspace status"
        className={`os-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
          isDemo ? "border border-amber-300/50 bg-amber-50/40" : ""
        }`}
      >
        <div className="min-w-0">
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${
              isDemo ? "text-amber-800" : "text-rinads-primary"
            }`}
          >
            {workspace.headline}
          </p>
          <p className="mt-1 text-sm text-gray-700">{workspace.detail}</p>
          {workspace.organizationName && workspace.mode === "live" && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{workspace.organizationName}</p>
          )}
        </div>
        {isDemo && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-11 shrink-0 rounded-xl border border-amber-400/60 bg-white/70 px-3 text-xs font-semibold text-amber-900 transition hover:bg-white"
          >
            About this environment
          </button>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close environment details"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="os-glass relative z-10 w-full max-w-md rounded-3xl p-5 shadow-2xl"
          >
            <h2 id={titleId} className="text-base font-semibold text-gray-900">
              About this environment
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>
                <span className="font-semibold">Organisation context:</span> Sample / demo
              </li>
              <li>
                <span className="font-semibold">Permissions model:</span> Enforced in product flows
              </li>
              <li>
                <span className="font-semibold">RINPO mode:</span> Recommendation only
              </li>
              <li>
                <span className="font-semibold">Data source:</span> Demo adapter (`source: demo`)
              </li>
              <li>
                <span className="font-semibold">Action limitations:</span> Sample metrics are not live
                operational results
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 min-h-11 w-full rounded-xl bg-black px-4 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
