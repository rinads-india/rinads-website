import Link from "next/link";
import type { ReactNode } from "react";
import type { Section } from "@rinads/company-os-engine";

export function OsPage({ title, eyebrow, summary, actions, children }: { title: string; eyebrow?: string; summary?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main id="main" className="flex flex-col gap-4">
      <header className="os-glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">{eyebrow}</p>}
            <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
            {summary && <p className="mt-2 max-w-3xl text-sm text-gray-600">{summary}</p>}
          </div>
          {actions}
        </div>
      </header>
      {children}
    </main>
  );
}

export function Panel({ title, subtitle, right, children, id }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode; id?: string }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} id={id} className="os-glass rounded-3xl p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={headingId} className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info";
const TONE: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  good: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-900",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{children}</span>;
}

export function severityTone(s: "info" | "attention" | "critical"): Tone {
  return s === "critical" ? "bad" : s === "attention" ? "warn" : "info";
}

export function Metric({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  return (
    <div className="rounded-2xl bg-white/60 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "bad" ? "text-red-700" : tone === "warn" ? "text-amber-800" : "text-gray-900"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

/** Honest placeholder for a metric whose source is unavailable / not connected. */
export function UnavailableMetric({ label, reason, state }: { label: string; reason: string; state: "unavailable" | "not_connected" }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/40 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-500">{state === "not_connected" ? "Not connected" : "Unavailable"}</p>
      <p className="mt-1 text-xs text-gray-500">{reason}</p>
    </div>
  );
}

/** Renders `children(data)` for an available section, otherwise an explicit unavailable / not-connected state. */
export function SectionGate<T>({ section, label, children }: { section: Section<T>; label: string; children: (data: T) => ReactNode }) {
  if (section.state === "available") return <>{children(section.data)}</>;
  return (
    <div role="status" className="rounded-2xl border border-dashed border-gray-300 bg-white/40 p-4 text-sm text-gray-600">
      <p className="font-semibold text-gray-700">{label}: {section.state === "not_connected" ? "not connected" : "unavailable"}</p>
      <p className="mt-1 text-xs">{section.reason}</p>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div role="status" className="rounded-2xl border border-dashed border-gray-300 bg-white/40 p-5 text-center">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function NotReady({ kind }: { kind: "demo" | "no-org" }) {
  return (
    <OsPage title="Company OS needs a live organisation" eyebrow="Not available">
      <Panel title={kind === "demo" ? "Demo mode" : "No active organisation"}>
        <p className="text-sm text-gray-700">
          {kind === "demo"
            ? "This site is running in demo-auth mode. The Company OS never shows invented data, so these workspaces only render for a signed-in member of a real organisation (Supabase mode)."
            : "Your account has no active organisation yet. Create or join one to use the Company OS."}
        </p>
        <Link href="/os" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white">Back to Home</Link>
      </Panel>
    </OsPage>
  );
}

export function NoAccess({ title, permission }: { title: string; permission: string }) {
  return (
    <OsPage title={title} eyebrow="Restricted">
      <Panel title="Your role does not include access">
        <p className="text-sm text-gray-700">
          This workspace needs the <code className="rounded bg-gray-100 px-1">{permission}</code> permission. Ask an organisation admin if you need it.
          Nothing is hidden or approximated for you — the data simply is not shared with your role.
        </p>
        <Link href="/os" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white">Back to Home</Link>
      </Panel>
    </OsPage>
  );
}

export type Column<R> = { header: string; cell: (row: R) => ReactNode; className?: string };

export function Table<R>({ caption, columns, rows, empty }: { caption: string; columns: Column<R>[]; rows: readonly R[]; empty?: ReactNode }) {
  if (rows.length === 0) return <>{empty ?? <Empty title="Nothing here yet" />}</>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white/50">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500">
            {columns.map((c) => (
              <th key={c.header} scope="col" className={`px-3 py-2 font-medium ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              {columns.map((c) => (
                <td key={c.header} className={`px-3 py-2 align-top text-gray-800 ${c.className ?? ""}`}>{c.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Notes({ notes }: { notes: readonly string[] }) {
  if (notes.length === 0) return null;
  return (
    <p role="note" className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-900">
      {notes.join(" ")}
    </p>
  );
}

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center rounded-xl border border-gray-300/80 bg-white/70 px-4 text-sm font-semibold text-gray-900 hover:bg-white">
      {children}
    </Link>
  );
}
