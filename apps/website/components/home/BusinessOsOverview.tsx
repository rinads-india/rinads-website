import Link from "next/link";
import { ArrowRight } from "lucide-react";

const MODULE_GROUPS = [
  {
    label: "Customers",
    items: ["Leads", "Clients", "CRM", "Follow-ups"],
  },
  {
    label: "Work",
    items: ["Projects", "Tasks", "Calendar", "Team"],
  },
  {
    label: "Finance",
    items: ["Invoices", "Payments", "Expenses", "Reports"],
  },
  {
    label: "Growth",
    items: ["Marketing", "Campaigns", "Analytics", "SEO"],
  },
  {
    label: "Automation",
    items: ["Workflows", "Integrations", "Notifications", "Scheduled actions"],
  },
];

export function BusinessOsOverview() {
  return (
    <section className="relative z-40 bg-rinads-primary-darkest px-6 py-24 text-white md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
          Business OS
        </p>
        <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">
          Customers · Work · Money · Growth · Automation
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          One operating system for running your business — with functional modules inside, not a
          dozen separate apps.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {MODULE_GROUPS.map((group) => (
            <div key={group.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rinads-primary">
                {group.label}
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-white/75">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Link
          href="/business-os"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Explore Business OS
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
