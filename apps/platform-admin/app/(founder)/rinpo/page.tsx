import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { loadRinpoControlSnapshot } from "@/lib/rinpo-control/adapters";
import type { ConnectionState } from "@/lib/founder-intelligence/types";

export const dynamic = "force-dynamic";

const stateLabels: Record<ConnectionState, string> = {
  operational: "Operational",
  degraded: "Degraded",
  unavailable: "Unavailable",
  not_connected: "Not connected",
};

const stateClasses: Record<ConnectionState, string> = {
  operational: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  degraded: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  unavailable: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  not_connected: "border-white/10 bg-white/[0.04] text-white/60",
};

const lifecycle = [
  ["Identity", "Resolve the signed-in actor and service identity."],
  ["Tenant", "Resolve organization/workspace scope before retrieval."],
  ["Authorization", "Evaluate role and explicit tool/data permission."],
  ["Context + memory", "Retrieve only permitted operational context with provenance."],
  ["Model gateway", "Use a replaceable model adapter for structured reasoning."],
  ["Policy", "Classify risk and evaluate action policy."],
  ["Approval", "Require a human decision whenever policy demands it."],
  ["Execution", "Run the deterministic tool/runtime path, not model text."],
  ["Audit + learning", "Record result, evidence and approved memory/evaluation updates."],
] as const;

const safetyRules = [
  "No direct model-to-production mutation path.",
  "No silent bypass of confirmation or approval gates.",
  "No tenant data retrieval without explicit scope and authorization.",
  "No invented health, usage or cost metrics when a live source is unavailable.",
] as const;

function StatusBadge({ state }: { state: ConnectionState }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${stateClasses[state]}`}
    >
      <span aria-hidden="true">●</span>
      {stateLabels[state]}
    </span>
  );
}

export default async function RinpoControlPage() {
  const snapshot = await loadRinpoControlSnapshot();
  const runtimeHref = snapshot.runtime.href;
  const overallState: ConnectionState =
    snapshot.runtime.state === "operational" &&
    snapshot.intelligenceBackend.state === "operational" &&
    snapshot.dataPlaneState === "operational"
      ? "operational"
      : snapshot.runtime.state === "not_connected" && snapshot.dataPlaneState === "not_connected"
        ? "not_connected"
        : "degraded";

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              RINADS private control plane
            </p>
            <h1 className="mt-1 text-lg font-semibold">RINPO Production Control</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link className="rounded-lg border border-white/10 px-3 py-2 hover:border-violet-300/50" href="/founder-intelligence">
              Founder Intelligence
            </Link>
            <Link className="rounded-lg border border-white/10 px-3 py-2 hover:border-violet-300/50" href="/">
              Admin
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-transparent p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">System of intelligence</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Govern RINPO from one truthful surface.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  Live source health, canonical RINPO data, approval pressure and safety boundaries are shown here without demo counters or inferred operational status.
                </p>
              </div>
              <StatusBadge state={overallState} />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">Runtime</p>
                <div className="mt-3"><StatusBadge state={snapshot.runtime.state} /></div>
                <p className="mt-3 text-xs leading-5 text-white/55">{snapshot.runtime.detail}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">Intelligence backend</p>
                <div className="mt-3"><StatusBadge state={snapshot.intelligenceBackend.state} /></div>
                <p className="mt-3 text-xs leading-5 text-white/55">{snapshot.intelligenceBackend.detail}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/45">Control data</p>
                <div className="mt-3"><StatusBadge state={snapshot.dataPlaneState} /></div>
                <p className="mt-3 text-xs leading-5 text-white/55">{snapshot.dataPlaneDetail}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Founder safety contract</p>
            <h2 className="mt-2 text-xl font-semibold">Production actions remain governed.</h2>
            <div className="mt-5 space-y-3">
              {safetyRules.map((rule) => (
                <div key={rule} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <span className="mt-0.5 text-violet-300" aria-hidden="true">✓</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section aria-labelledby="live-data-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Live system of record</p>
              <h2 id="live-data-title" className="mt-1 text-2xl font-semibold">RINPO control data</h2>
            </div>
            <p className="text-xs text-white/45">Snapshot: {new Date(snapshot.checkedAt).toLocaleString("en-IN")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {snapshot.metrics.map((metric) => (
              <article key={metric.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/70">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">{metric.value ?? "—"}</p>
                  </div>
                  <StatusBadge state={metric.state} />
                </div>
                <p className="mt-4 text-xs leading-5 text-white/50">{metric.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Execution governance</p>
            <h2 className="mt-2 text-2xl font-semibold">RINPO request lifecycle</h2>
            <p className="mt-2 text-sm text-white/55">Every consequential action must remain inspectable from identity through execution and audit.</p>
            <ol className="mt-6 grid gap-3 md:grid-cols-2">
              {lifecycle.map(([name, detail], index) => (
                <li key={name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300/30 bg-violet-400/10 text-xs font-semibold text-violet-200">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-medium">{name}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Runtime console</p>
              <h2 className="mt-2 text-xl font-semibold">Execution plane</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{snapshot.runtime.detail}</p>
              {runtimeHref ? (
                <a className="mt-5 inline-flex rounded-lg border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100" href={runtimeHref} target="_blank" rel="noreferrer">
                  Open runtime source ↗
                </a>
              ) : (
                <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/50">Configure RINPO_RUNTIME_CONSOLE_URL to expose the governed runtime console link.</p>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Control scope</p>
              <h2 className="mt-2 text-xl font-semibold">Next production surfaces</h2>
              <div className="mt-4 grid gap-2 text-sm text-white/65">
                {[
                  "Session inspection",
                  "Memory provenance and correction",
                  "Tool registry and permission scopes",
                  "Approval queue and policy decisions",
                  "Agent runs and evaluations",
                  "Model/usage/cost observability",
                  "Release/version governance",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">{item}</div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
