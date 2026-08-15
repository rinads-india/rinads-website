import Link from "next/link";

export default async function ProvisioningStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const { orgId } = await searchParams;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="text-3xl font-semibold">Provisioning your workspace</h1>
      <p className="text-muted-foreground">
        Your organization{orgId ? ` (${orgId})` : ""} is being seeded with the Ambady nursery template.
        Commerce catalog and inventory ledger rows are created via the platform provisioning pipeline.
      </p>
      <div className="rounded-xl border border-black/10 bg-white p-6 text-sm">
        <p className="font-medium text-green-700">Status: completed (demo) / pending (Supabase job)</p>
        <p className="mt-2 text-muted-foreground">
          In Supabase mode, check <code>tenant_provisioning_jobs</code> for async seed status.
        </p>
      </div>
      <Link href="/" className="text-sm text-[#9f4bc7]">
        Return to home
      </Link>
    </div>
  );
}
