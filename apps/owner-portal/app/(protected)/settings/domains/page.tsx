import Link from "next/link";

export default function SettingsDomainsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Custom domains</h1>
      <p className="text-sm text-muted-foreground">
        Point your domain to RINADS storefront. Add a TXT record at <code>_rinads-verify</code> with the verification token.
      </p>
      <div className="rounded-xl border border-white/10 bg-surface p-4 text-sm space-y-2">
        <p>1. Add domain in this settings page (or ask your platform admin).</p>
        <p>2. Publish DNS TXT record shown after add.</p>
        <p>3. Verify — domain attaches to Vercel storefront project on success.</p>
        <p>Default storefront: <code>{`{slug}.store.rinads.com`}</code></p>
      </div>
      <Link href="/" className="text-sm text-rinads-primary">← Dashboard</Link>
    </div>
  );
}
