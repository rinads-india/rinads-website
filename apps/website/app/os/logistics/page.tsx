import Link from "next/link";
import { getLogisticsOsSnapshot } from "@/lib/logistics-os";
import { LogisticsRoutePlanner } from "./LogisticsRoutePlanner";

const panel = "rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur";

function stateClass(state: string): string {
  if (state === "live") return "bg-emerald-100 text-emerald-900";
  if (state === "verification_pending") return "bg-sky-100 text-sky-900";
  if (state === "credentials_detected") return "bg-amber-100 text-amber-950";
  return "bg-gray-100 text-gray-700";
}

export default function OsLogisticsPage() {
  const snapshot = getLogisticsOsSnapshot();
  const metrics = [
    ["Registered providers", snapshot.registeredProviders],
    ["Credentials detected", snapshot.credentialedProviders],
    ["Verified live", snapshot.liveProviders],
    ["Routing modes", snapshot.routingStrategies.length],
  ] as const;

  return (
    <main id="main" className="space-y-6 pb-12">
      <section className="overflow-hidden rounded-[2rem] bg-black p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                RINADS Logistics OS
              </span>
              <span className="rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-950">
                Fail-closed carrier foundation
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              One shipment intent. Multiple logistics capabilities. One governed decision.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
              RINADS Intelligence controls provider selection and policy. RINPO Runtime will execute approved bookings and lifecycle work. Carrier APIs remain adapters behind the existing ShipmentService — never a second order stack.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Link href="/os/work" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">Work</Link>
            <Link href="/os/money" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">Money</Link>
            <Link href="/os/automate" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">Automate</Link>
            <Link href="/os/customers" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">Customers</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article key={label} className={panel}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{value}</p>
          </article>
        ))}
      </section>

      {snapshot.liveProviders === 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          No courier adapter is currently verified live in this repository contract. Logistics OS will validate capability and policy, but it will not show invented rates, create fake AWBs or claim a pickup until provider credentials, adapter contract tests, webhooks and a controlled shipment pass the production gate.
        </section>
      ) : null}

      <section className={panel}>
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Shipment intake</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">RI route-intent planner</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            Validate pickup, destination and required capabilities before rate discovery. Production booking remains server-side and governed by the provider router.
          </p>
        </div>
        <LogisticsRoutePlanner providers={snapshot.providers} />
      </section>

      <section className={panel}>
        <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Capability Registry</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Carrier readiness</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
              Provider names are registered capabilities, not claims of a live commercial integration. Environment-variable names are safe setup metadata; secret values never reach this page.
            </p>
          </div>
          <span className="rounded-full bg-gray-950 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
            {snapshot.executionMode.replaceAll("_", " ")}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {snapshot.providers.map((provider) => (
            <article key={provider.key} className="rounded-2xl border border-black/5 bg-white/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-950">{provider.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{provider.role}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${stateClass(provider.state)}`}>
                  {provider.state.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.capabilities.map((capability) => (
                  <span key={capability} className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-700">
                    {capability.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
              <div className="mt-3 border-t border-black/5 pt-3 text-[11px] leading-5 text-gray-500">
                {provider.requiredEnv.length > 0 ? (
                  <p>Credential contract: {provider.requiredEnv.join(" + ")}</p>
                ) : (
                  <p>No external credential contract defined yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={panel}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Governed autonomy</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">RI control plane → RINPO Runtime execution</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["01 Observe", "Capture shipment intent, order, package and lifecycle events."],
              ["02 Understand", "Resolve route, parcel, COD, SLA, risk and tenant constraints."],
              ["03 Recommend", "Score serviceable providers by cost, ETA, reliability, RTO, SLA, margin and tenant priority."],
              ["04 Authorize", "Apply policy limits and require human approval for exceptions or high-risk movement."],
              ["05 Act", "RINPO Runtime calls the selected adapter only after authorization."],
              ["06 Audit", "Persist provider decision evidence, shipment events, exceptions and outcomes for the next decision."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-black/5 bg-white/75 p-4">
                <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-gray-600">{copy}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={panel}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Channel architecture</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">Keep commerce and automation modular</h2>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["Shopify", "Merchant acquisition + order/fulfilment connector. Not the logistics system of record."],
              ["ONDC", "Delivery-network adapter/discovery layer behind the same capability registry."],
              ["Hostinger / n8n", "Workflow plane for notifications and non-critical integrations. Never booking authority."],
              ["Supabase", "Tenant provider configuration, routing policy and append-only RI decision evidence under RLS."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-black/5 bg-white/75 p-4">
                <h3 className="font-semibold text-gray-950">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">{copy}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
