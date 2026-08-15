import Link from "next/link";

export default function SettingsBillingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="text-sm text-muted-foreground">
        View plan usage and upgrade via Razorpay. Configure <code>RAZORPAY_KEY_ID</code> in staging/production.
      </p>
      <div className="rounded-xl border border-white/10 bg-surface p-4 text-sm space-y-2">
        <p>Starter → Growth → Platform upgrades open a Razorpay subscription checkout.</p>
        <p>Usage limits (orders/month, seats) enforce at checkout when over plan quota.</p>
      </div>
      <Link href="/" className="text-sm text-rinads-primary">← Dashboard</Link>
    </div>
  );
}
