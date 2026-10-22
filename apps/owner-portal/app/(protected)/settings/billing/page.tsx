import Link from "next/link";
import { getOwnerBillingPlanDisplays } from "@/lib/billing-plans";
import { startRazorpaySubscriptionCheckout } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_plan: "The selected billing plan is invalid.",
  auth_required: "Sign in again before changing billing.",
  forbidden: "This organization is not available for billing changes.",
  demo_mode: "Billing checkout is disabled in demo mode.",
  owner_required: "Only an owner, founder or administrator can change the subscription.",
  plan_not_configured: "This plan is not mapped to a Razorpay Plan yet.",
  invalid_total_count: "The billing-cycle configuration for this plan is invalid.",
  razorpay_not_configured: "Razorpay API credentials are not configured for this environment.",
  provider_error: "Razorpay could not create the subscription. No RINADS entitlement was activated.",
  authorization_url_missing: "Razorpay created no customer authorization URL. No entitlement was activated.",
};

type BillingPageProps = {
  searchParams?: Promise<{ error?: string | string[] }>;
};

export default async function SettingsBillingPage({ searchParams }: BillingPageProps) {
  const params = searchParams ? await searchParams : {};
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const plans = getOwnerBillingPlanDisplays();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Subscription checkout is created server-side with Razorpay. RINADS access changes only after verified billing events are processed.
        </p>
      </div>

      {errorCode && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {ERROR_MESSAGES[errorCode] ?? "Billing checkout could not be started."}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <section key={plan.key} className="rounded-2xl border border-white/10 bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{plan.label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  plan.configured
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-amber-500/10 text-amber-200"
                }`}
              >
                {plan.configured ? "Checkout ready" : "Needs plan mapping"}
              </span>
            </div>

            <form action={startRazorpaySubscriptionCheckout} className="mt-5">
              <input type="hidden" name="planKey" value={plan.key} />
              <button
                type="submit"
                disabled={!plan.configured}
                className="w-full rounded-xl bg-rinads-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {plan.configured ? `Choose ${plan.label}` : "Configuration required"}
              </button>
            </form>
          </section>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-surface p-4 text-sm space-y-2">
        <p className="font-medium">Production billing boundary</p>
        <p className="text-muted-foreground">
          A checkout redirect is not an entitlement grant. Subscription activation, renewal, pending and halted states remain webhook-authoritative and must be reconciled against the organization before access changes.
        </p>
      </div>

      <Link href="/" className="text-sm text-rinads-primary">← Dashboard</Link>
    </div>
  );
}
