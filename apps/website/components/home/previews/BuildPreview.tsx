export function BuildPreview() {
  return (
    <div className="border border-white/10 bg-black/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">Build OS</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Software factory</h3>
      <ol className="mt-4 space-y-2">
        {["Discovery", "PRD", "Architecture", "Build", "Test", "Deploy"].map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-xs text-white/75">
            <span className="flex h-6 w-6 items-center justify-center border border-rinads-primary/40 text-[10px] text-rinads-primary">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
