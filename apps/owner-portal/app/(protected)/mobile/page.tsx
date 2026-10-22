import Link from "next/link";
import { Badge, Card } from "@rinads/ui";

const commandAreas = [
  {
    href: "/operations",
    label: "Control Tower",
    description: "Business pulse, exceptions and operating priorities",
    symbol: "01",
  },
  {
    href: "/runtime",
    label: "RINPO Runtime",
    description: "Governed intelligence, recommendations and execution",
    symbol: "RI",
  },
  {
    href: "/approvals",
    label: "Approvals",
    description: "Review actions before governed execution",
    symbol: "OK",
  },
  {
    href: "/orders",
    label: "Orders",
    description: "Customer demand and fulfilment flow",
    symbol: "OR",
  },
  {
    href: "/inventory",
    label: "Inventory",
    description: "Stock visibility, movements and exceptions",
    symbol: "IN",
  },
  {
    href: "/tasks",
    label: "Work",
    description: "Operational tasks and accountable follow-through",
    symbol: "WK",
  },
] as const;

const industries = [
  { href: "/jewellery", name: "Jewellery OS", state: "Active" },
  { href: "/operations", name: "Commerce OS", state: "Active" },
  { href: "/fulfilment", name: "Logistics", state: "Connected" },
] as const;

export default function RinadsWorkMobilePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24">
      <header className="overflow-hidden rounded-3xl border border-rinads-primary/15 bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="success">Production</Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                RINADS WORK
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              Run the business from one place.
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mobile control plane for founders, operators and staff — powered by RINADS Intelligence and RINPO Runtime.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rinads-primary text-xs font-black tracking-wider text-white">
            RI
          </div>
        </div>
      </header>

      <section aria-labelledby="work-pulse-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
          Founder pulse
        </p>
        <h2 id="work-pulse-heading" className="mt-1 text-lg font-semibold text-foreground">
          What needs attention
        </h2>
        <Card className="mt-3 rounded-3xl border-rinads-primary/20 bg-rinads-primary/5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-surface p-3">
              <p className="text-xl font-bold text-foreground">Live</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Business graph</p>
            </div>
            <div className="rounded-2xl bg-surface p-3">
              <p className="text-xl font-bold text-foreground">Gov.</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Action flow</p>
            </div>
            <div className="rounded-2xl bg-surface p-3">
              <p className="text-xl font-bold text-foreground">RLS</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Tenant safety</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            RINADS Intelligence follows Observe → Understand → Recommend → Authorize → Act → Audit. Use Runtime for governed actions and Approvals for human authorization.
          </p>
        </Card>
      </section>

      <section aria-labelledby="work-command-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              Command areas
            </p>
            <h2 id="work-command-heading" className="mt-1 text-lg font-semibold text-foreground">
              Mobile operating system
            </h2>
          </div>
          <Link href="/search" className="text-xs font-semibold text-rinads-primary hover:underline">
            Search
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {commandAreas.map(({ href, label, description, symbol }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-3xl border border-rinads-primary/10 bg-surface p-4 transition hover:border-rinads-primary/30 hover:bg-rinads-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rinads-primary/10 text-[11px] font-black tracking-wider text-rinads-primary">
                {symbol}
              </div>
              <p className="mt-4 font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="work-industry-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
          Capability registry
        </p>
        <h2 id="work-industry-heading" className="mt-1 text-lg font-semibold text-foreground">
          Active operating packs
        </h2>
        <div className="mt-3 space-y-3">
          {industries.map(({ href, name, state }) => (
            <Link
              key={name}
              href={href}
              className="flex items-center justify-between gap-4 rounded-2xl border border-rinads-primary/10 bg-surface p-4 transition hover:bg-rinads-primary/5"
            >
              <div>
                <p className="font-semibold text-foreground">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Loaded through the shared RINADS platform foundation</p>
              </div>
              <Badge tone="success">{state}</Badge>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="work-rinpo-heading">
        <Card className="rounded-3xl bg-foreground text-background">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
            RINPO
          </p>
          <h2 id="work-rinpo-heading" className="mt-2 text-xl font-semibold">
            Ask first. Navigate second.
          </h2>
          <p className="mt-2 text-sm leading-6 opacity-70">
            Use Runtime as the conversational layer over operations. Recommendations stay governed; approval-sensitive actions remain auditable before execution.
          </p>
          <Link
            href="/runtime"
            className="mt-5 inline-flex rounded-full bg-rinads-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open RINPO Runtime
          </Link>
        </Card>
      </section>

      <nav
        aria-label="RINADS WORK mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-md grid-cols-4 rounded-3xl border border-rinads-primary/15 bg-surface/95 p-2 shadow-lg backdrop-blur"
      >
        {[
          ["/mobile", "Work"],
          ["/operations", "Pulse"],
          ["/runtime", "RINPO"],
          ["/approvals", "Approve"],
        ].map(([href, label], index) => (
          <Link
            key={href}
            href={href}
            className={`rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition ${
              index === 0 ? "bg-rinads-primary/10 text-rinads-primary" : "text-muted-foreground hover:text-rinads-primary"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
