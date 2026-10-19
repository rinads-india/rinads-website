/** Shared suspense fallback for console page content (also used by loading.tsx). */
export function ConsolePageFallback() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-surface-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-border bg-surface" />
    </div>
  );
}
