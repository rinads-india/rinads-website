import Link from "next/link";
import { loadRinpoControlSnapshot } from "@/lib/rinpo-control/adapters";

export const dynamic = "force-dynamic";

function shortId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString("en-IN");
}

export default async function RinpoSessionInspectionPage() {
  const snapshot = await loadRinpoControlSnapshot();
  const inspection = snapshot.sessionInspection;

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              RINADS private control plane
            </p>
            <h1 className="mt-1 text-lg font-semibold">RINPO Session Inspection</h1>
          </div>
          <Link
            href="/rinpo"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-violet-300/50"
          >
            ← RINPO Production Control
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <section className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-transparent p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Privacy-preserving inspection
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Actor and tenant metadata without transcript access.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
            This founder-only surface retrieves session identifiers, organization scope, actor scope and timestamps only.
            RINPO transcript messages, conversation context, memory content and model payloads are not requested by this view.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
            <span className="font-semibold text-white">Source status:</span> {inspection.state}. {inspection.detail}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Recent sessions</p>
              <h2 className="mt-1 text-2xl font-semibold">Metadata only</h2>
            </div>
            <p className="text-xs text-white/45">Snapshot: {new Date(snapshot.checkedAt).toLocaleString("en-IN")}</p>
          </div>

          {inspection.sessions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/55">
              No session metadata is available from the configured production source.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-black/30 text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {inspection.sessions.map((session) => (
                    <tr key={session.id} className="bg-white/[0.02] text-white/70">
                      <td className="px-4 py-3 font-mono text-xs text-white/80" title={session.id}>{shortId(session.id)}</td>
                      <td className="px-4 py-3 font-mono text-xs" title={session.organizationId}>{shortId(session.organizationId)}</td>
                      <td className="px-4 py-3 font-mono text-xs" title={session.userId}>{shortId(session.userId)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{formatTimestamp(session.createdAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{formatTimestamp(session.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Boundary</p>
          <h2 className="mt-2 text-xl font-semibold">Inspection is not surveillance.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            Transcript or memory review must be a separate, explicit workflow with purpose, scope, provenance, retention and audit controls. This page intentionally cannot read or display those contents.
          </p>
        </section>
      </main>
    </div>
  );
}
