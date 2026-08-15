import { listPlansAction } from "../actions/tenants";
import { planIncludesModule } from "@rinads/platform";

export default async function PlansPage() {
  const result = await listPlansAction();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Plan catalog</h2>
      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {result.plans.map((plan) => (
            <div key={plan.key} className="card">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.key}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {["commerce", "inventory", "procurement", "fulfilment"].map((mod) => (
                  <li key={mod}>
                    {mod}: {planIncludesModule(plan.limits, mod) ? "included" : "—"}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Billing webhooks (Razorpay/Stripe) are deferred — plans attach on provision only.
      </p>
    </div>
  );
}
