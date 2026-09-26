export function WorkspaceDataNotice({ demo }: { demo: boolean }) {
  return (
    <p className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
      {demo
        ? "Explicit development demo mode. Catalog, orders, and tickets are sample data — not live production owner/customer data."
        : "Catalog, orders, and tickets currently use sample adapters. Do not treat displayed records as live production owner/customer data."}
    </p>
  );
}
