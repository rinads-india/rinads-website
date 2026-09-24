"use client";

/**
 * Demo workspace status — never presents illustrative metrics as live SLA.
 */
export function OsSystemStatus() {
  return (
    <aside className="os-glass-dark rounded-3xl p-4 text-white shadow-sm lg:w-72">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
        Demo workspace
      </p>
      <p className="mt-2 text-xs text-white/50">Sample data · not a live status feed or uptime guarantee</p>

      <div className="mt-5 space-y-3">
        {[
          { label: "Organisation context", detail: "Active" },
          { label: "Permissions model", detail: "Enforced in product flows" },
          { label: "RINPO guidance", detail: "Recommendation mode" },
        ].map((row) => (
          <div key={row.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <p className="text-xs text-white/55">{row.label}</p>
            <p className="mt-1 text-sm font-semibold">{row.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rinads-primary text-sm font-bold">
          R
        </span>
        <div>
          <p className="text-sm font-semibold">Guided demo mode</p>
          <p className="text-xs text-white/55">Actions require supported permissions and approvals</p>
        </div>
      </div>
    </aside>
  );
}
