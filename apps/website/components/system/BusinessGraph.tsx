"use client";

const LIFECYCLE = [
  "Discover",
  "Lead",
  "Customer",
  "Proposal",
  "Project / Order",
  "Invoice",
  "Payment",
  "Fulfilment",
  "Follow-up",
  "Retention",
] as const;

/**
 * Business lifecycle visual with RINPO as the intelligence layer watching the complete flow.
 */
export function BusinessGraph({ className = "" }: { className?: string }) {
  return (
    <section
      className={`mx-auto max-w-7xl px-6 md:px-12 lg:px-20 ${className}`}
      aria-labelledby="business-graph-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
        Business lifecycle
      </p>
      <h2 id="business-graph-heading" className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
        From discover to retention — under one intelligence layer
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
        RINPO watches the complete lifecycle so your team understands what matters and moves approved
        work forward through RINPO Runtime.
      </p>

      <div className="relative mt-10 overflow-x-auto pb-2">
        <ol className="flex min-w-max items-stretch gap-2 md:min-w-0 md:flex-wrap md:justify-center">
          {LIFECYCLE.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center md:min-w-[6.5rem]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block text-sm font-semibold text-foreground">{step}</span>
              </div>
              {index < LIFECYCLE.length - 1 ? (
                <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-rinads-primary/40 bg-rinads-primary/5 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-foreground">
          RINPO · intelligence layer across the lifecycle
        </p>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          Communicates · RINADS Intelligence understands · RINPO Runtime executes with permissions and
          approvals
        </p>
      </div>
    </section>
  );
}
