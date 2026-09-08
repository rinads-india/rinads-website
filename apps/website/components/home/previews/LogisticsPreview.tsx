export function LogisticsPreview() {
  return (
    <div className="border border-white/10 bg-black/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">Logistics OS</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Control tower</h3>
      <div className="mt-4 space-y-2">
        {[
          { id: "SHP-2041", status: "In transit", tone: "text-emerald-400" },
          { id: "SHP-2042", status: "Exception", tone: "text-amber-400" },
          { id: "SHP-2043", status: "Delivered", tone: "text-white/60" },
        ].map((row) => (
          <div key={row.id} className="flex items-center justify-between border border-white/10 px-3 py-2 text-xs">
            <span className="font-mono text-white/80">{row.id}</span>
            <span className={row.tone}>{row.status}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-white/45">Courier · Porter · 3PL — provider neutral</p>
    </div>
  );
}
