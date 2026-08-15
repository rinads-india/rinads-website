import { listTenantsAction } from "./actions/tenants";

export default async function DashboardPage() {
  const result = await listTenantsAction();
  const tenants = result.ok ? result.tenants : [];
  const suspended = tenants.filter((t) => t.status === "suspended").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Platform dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tenant provisioning, lifecycle, and audit for the RINADS control plane.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted-foreground">Total tenants</p>
          <p className="mt-2 text-3xl font-semibold">{tenants.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Suspended</p>
          <p className="mt-2 text-3xl font-semibold">{suspended}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Mode</p>
          <p className="mt-2 text-lg font-semibold">
            {process.env.USE_DEMO_STORE === "1" || process.env.USE_SUPABASE !== "1" ? "Demo store" : "Supabase"}
          </p>
        </div>
      </div>

      {!result.ok && (
        <p className="text-sm text-red-400">Could not load tenants: {result.error}</p>
      )}
    </div>
  );
}
