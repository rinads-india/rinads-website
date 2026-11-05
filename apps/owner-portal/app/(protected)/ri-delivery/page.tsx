/**
 * RI DELIVERY owner pilot preview. This route is protected by the existing
 * authenticated owner-portal layout. No live jobs, riders, PII, or payments.
 */
export const dynamic = "force-dynamic";

const gates = [
  ["Driver identity and vehicle checks", "Driving licence, insurance, consent and fit for load", "Pending"],
  ["Tenant-isolated dispatch API", "Durable offers, acceptance, optimistic locking and RLS", "Not connected"],
  ["RINPO Runtime approval", "Bounded actions, approved fare, escalation and audit", "Domain prototype"],
  ["Driver settlement", "Ledger proposal with finance approval; no automatic transfers", "Not connected"],
] as const;

export default function RiDeliveryPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-label="RI DELIVERY pilot readiness">
      <div className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950 to-slate-950 p-7 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            RINADS · RI LOGISTICS
          </p>
          <span className="rounded-full border border-violet-300/40 px-3 py-1 text-xs text-violet-100">
            Preview only · Not live
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">RI DELIVERY</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100">
          One logistics operating system for client staff, RINADS-managed riders
          and independent opt-in partners — governed by RINADS INTELLIGENCE and RINPO Runtime.
        </p>
        <p className="mt-5 rounded-xl border border-violet-400/30 bg-violet-300/10 p-4 text-sm text-violet-100" role="status">
          Job dispatch, GPS, customer notifications and driver payments are not connected.
          This page cannot create a live offer.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" aria-label="Pilot release gates">
        {gates.map(([title, detail, status]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{status}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{detail}</p>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Controlled pilot</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cake Farm is the proposed first pilot, subject to client approval,
          verified vehicle and rider details, reconciled payments, and operational sign-off.
        </p>
      </div>
    </section>
  );
}
