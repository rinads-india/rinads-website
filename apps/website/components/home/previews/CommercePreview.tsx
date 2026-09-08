export function CommercePreview() {
  return (
    <div className="border border-white/10 bg-black/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">Commerce OS</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Storefront preview</h3>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Catalogue", "Inventory", "Orders"].map((label) => (
          <div key={label} className="border border-white/10 bg-white/5 px-2 py-6 text-center text-[11px] text-white/70">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border border-rinads-primary/20 bg-rinads-primary/10 px-3 py-2 text-xs text-white/80">
        <span>AI Commerce Assistant</span>
        <span className="text-rinads-primary">Live</span>
      </div>
    </div>
  );
}
