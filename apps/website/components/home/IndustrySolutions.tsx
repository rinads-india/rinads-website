import Link from "next/link";

const VERTICALS = [
  {
    name: "Ambady Nursery",
    type: "Landscape OS",
    description: "Nursery and landscaping operations — live vertical template.",
    status: "available" as const,
  },
  {
    name: "Generic Retail",
    type: "Retail OS",
    description: "Catalog, orders, and storefront for retail businesses.",
    status: "available" as const,
  },
  {
    name: "RINAGLOW",
    type: "Salon OS",
    description: "Salon appointments, clients, and growth systems.",
    status: "coming" as const,
  },
  {
    name: "Clinic OS",
    type: "Healthcare",
    description: "Patient flow, scheduling, and practice operations.",
    status: "coming" as const,
  },
];

export function IndustrySolutions() {
  return (
    <section id="industry" className="relative z-40 bg-surface px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
          Industry solutions
        </p>
        <h2 className="max-w-3xl text-4xl font-black leading-tight text-foreground md:text-5xl">
          Business OS → Vertical OS
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Start with Business OS, then adopt industry-specific modules when you need vertical depth —
          not OS inflation on every feature.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((vertical) => (
            <div
              key={vertical.name}
              className="rounded-2xl border border-rinads-primary/15 p-6"
            >
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  vertical.status === "available"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {vertical.status === "available" ? "Available" : "Coming soon"}
              </span>
              <h3 className="mt-3 text-lg font-bold text-foreground">{vertical.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-rinads-primary">
                {vertical.type}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{vertical.description}</p>
            </div>
          ))}
        </div>

        <Link
          href="/business-os"
          className="mt-10 inline-block text-sm font-semibold text-rinads-primary hover:underline"
        >
          Start with Business OS →
        </Link>
      </div>
    </section>
  );
}
