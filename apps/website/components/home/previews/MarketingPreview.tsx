export function MarketingPreview() {
  return (
    <div className="border border-white/10 bg-black/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">Marketing OS</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Campaign board</h3>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Meta", "Google", "SEO", "WhatsApp"].map((ch) => (
          <div key={ch} className="border border-white/10 px-3 py-4">
            <p className="text-xs font-semibold text-foreground">{ch}</p>
            <div className="mt-2 h-1.5 w-full bg-white/10">
              <div className="h-full w-2/3 bg-rinads-primary/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
