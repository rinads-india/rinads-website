"use client";

const METRICS = [
  { label: "Performance", value: 98 },
  { label: "Security", value: 100 },
  { label: "Uptime", value: 99.9 },
] as const;

export function OsSystemStatus() {
  return (
    <aside className="os-glass-dark rounded-3xl p-4 text-white shadow-sm lg:w-72">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
        System Status
      </p>

      <div className="mt-4 space-y-3">
        {METRICS.map((metric) => (
          <div key={metric.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>{metric.label}</span>
              <span className="font-semibold">{metric.value}%</span>
            </div>
            <div className="os-progress">
              <span style={{ width: `${Math.min(metric.value, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rinads-primary text-sm font-bold">
          R
        </span>
        <div>
          <p className="text-sm font-semibold">All systems operational</p>
          <p className="flex items-center gap-1.5 text-xs text-emerald-300">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            RINPO intelligence online
          </p>
        </div>
      </div>
    </aside>
  );
}
