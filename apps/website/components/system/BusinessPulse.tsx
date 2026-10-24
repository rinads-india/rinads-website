"use client";

const METRICS = [
  { label: "Revenue", value: "₹4.2L", note: "MTD sample" },
  { label: "Open leads", value: "28", note: "Sample" },
  { label: "Follow-ups", value: "11", note: "Due today" },
  { label: "Projects at risk", value: "3", note: "Sample" },
  { label: "Outstanding invoices", value: "7", note: "Sample" },
  { label: "Orders", value: "19", note: "Open" },
] as const;

const ALERTS = [
  "2 invoices overdue beyond policy threshold",
  "Salon Saturday slot coverage is thin",
  "3 leads waiting more than 48 hours",
] as const;

const ATTENTION = [
  {
    title: "Follow up with Apex Nursery",
    detail: "Proposal sent 3 days ago — no reply yet.",
  },
  {
    title: "Approve overtime for weekend salon shift",
    detail: "Requires human approval before roster change.",
  },
  {
    title: "Restock low SKU: Ceramic planter set",
    detail: "Inventory below reorder point in demo warehouse.",
  },
] as const;

/**
 * Demonstrative workspace preview for the marketing homepage.
 * All figures are sample/demo — never presented as live customer metrics.
 */
export function BusinessPulse({ className = "" }: { className?: string }) {
  return (
    <section className={`mx-auto max-w-7xl px-6 md:px-12 lg:px-20 ${className}`} aria-labelledby="business-pulse-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
            Business Pulse · Demo
          </p>
          <h2 id="business-pulse-heading" className="mt-2 text-2xl font-bold text-white md:text-3xl">
            What needs attention across the business
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            See how customers, work and orders come together. This example uses sample data.
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
          Demo workspace · Synthetic data
        </span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              {m.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{m.value}</p>
            <p className="mt-1 text-xs text-white/70">{m.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
            Business alerts
          </h3>
          <ul className="mt-4 space-y-3">
            {ALERTS.map((alert) => (
              <li key={alert} className="flex gap-3 text-sm text-white/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rinads-primary" aria-hidden />
                {alert}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-rinads-primary/25 bg-rinads-primary/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-rinads-primary">
            RINPO attention · 3 items
          </h3>
          <ul className="mt-4 space-y-4">
            {ATTENTION.map((item) => (
              <li key={item.title}>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
