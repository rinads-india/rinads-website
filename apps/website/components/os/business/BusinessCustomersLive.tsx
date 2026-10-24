import { requirePlanModule } from "@rinads/tenancy";
import { createLiveCustomerAction } from "@/app/os/actions/live-business";
import { loadLiveCustomers, resolveLiveOsTenant } from "@/lib/os-tenant-live";

function isWritableEntitlement(state?: string) {
  return state === "paid_active" || state === "trialing" || state === "expiring";
}

export async function BusinessCustomersLive() {
  const { supabase, tenancy } = await resolveLiveOsTenant();
  if (!tenancy) {
    return (
      <section className="os-glass rounded-3xl p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        <p className="mt-2 text-sm text-gray-600">Choose an active RI ID organization to load tenant customers.</p>
      </section>
    );
  }

  const customers = await loadLiveCustomers(supabase, tenancy.organizationId);
  const moduleAccess = requirePlanModule(tenancy, "crm");
  const canWrite = moduleAccess.allowed && isWritableEntitlement(tenancy.entitlementState);
  const readOnly = tenancy.entitlementState === "expired_read_only";

  return (
    <section className="space-y-4">
      <div className="os-glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">Live tenant data</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Persisted to <code>cos_contacts</code> under the active organization. Supabase RLS and entitlement policies are authoritative.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${canWrite ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {canWrite ? "Write enabled" : readOnly ? "Read only" : "Upgrade / activate"}
          </span>
        </div>
      </div>

      {customers.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Customer data could not be loaded: {customers.error}
        </div>
      ) : null}

      {canWrite ? (
        <form action={createLiveCustomerAction} className="os-glass grid gap-3 rounded-3xl p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <h2 className="font-semibold text-gray-900">Add first customer</h2>
            <p className="mt-1 text-xs text-gray-500">The organization id is resolved server-side; it is never accepted from this form.</p>
          </div>
          <input name="fullName" required maxLength={160} placeholder="Customer name" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm" />
          <input name="title" maxLength={120} placeholder="Role / title" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm" />
          <input name="email" type="email" maxLength={240} placeholder="Email" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm" />
          <input name="phone" maxLength={40} placeholder="Phone" className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm" />
          <button type="submit" className="min-h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white sm:col-span-2 sm:justify-self-start">
            Save customer
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {readOnly
            ? "The trial has expired. Existing customers remain readable, but database write policies deny inserts and updates until conversion."
            : moduleAccess.allowed
              ? "Activate a paid plan or governed trial to create customers."
              : moduleAccess.reason}
        </div>
      )}

      <div className="os-glass overflow-hidden rounded-3xl">
        <div className="border-b border-gray-200/80 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Customer records</h2>
          <p className="mt-1 text-xs text-gray-500">{customers.data.length} persisted record{customers.data.length === 1 ? "" : "s"}</p>
        </div>
        {customers.data.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No customers yet. Create the first tenant-scoped record above.</div>
        ) : (
          <ul className="divide-y divide-gray-200/80">
            {customers.data.map((customer) => (
              <li key={customer.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{customer.fullName}</p>
                  <p className="text-xs text-gray-500">{customer.title ?? "Customer"}</p>
                </div>
                <div className="text-sm text-gray-600 sm:text-right">
                  {customer.email ? <p>{customer.email}</p> : null}
                  {customer.phone ? <p>{customer.phone}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
