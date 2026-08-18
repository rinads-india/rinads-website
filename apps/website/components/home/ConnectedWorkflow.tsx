const WORKFLOW_STEPS = [
  "Lead",
  "CRM",
  "Follow-up",
  "Project",
  "Tasks",
  "Invoice",
  "Payment",
  "Marketing",
  "Analytics",
  "RINPO",
  "Next Action",
];

export function ConnectedWorkflow() {
  return (
    <section
      id="connected-workflow"
      className="relative z-40 bg-surface px-6 py-24 md:px-12 md:py-32 lg:px-20"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
          Connected workflow
        </p>
        <h2 className="text-4xl font-black leading-tight text-foreground md:text-5xl">
          RINADS doesn&apos;t just store your business data. It connects it.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Everything in your business is connected — from first lead to next action.
        </p>

        <div className="mx-auto mt-16 flex max-w-xs flex-col items-center gap-0">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step} className="flex w-full flex-col items-center">
              <div
                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold uppercase tracking-wider ${
                  step === "RINPO"
                    ? "border-rinads-primary bg-rinads-primary/10 text-rinads-primary"
                    : "border-rinads-primary/20 bg-white/60 text-foreground dark:bg-black/20"
                }`}
              >
                {step}
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <span className="my-1 text-rinads-primary" aria-hidden>
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
