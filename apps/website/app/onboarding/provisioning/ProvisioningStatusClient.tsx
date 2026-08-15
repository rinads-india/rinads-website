"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProvisioningJobStatusAction } from "@/app/onboarding/actions/onboarding";

export function ProvisioningStatusClient() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") ?? "";
  const [status, setStatus] = useState("pending");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    async function poll() {
      const result = await getProvisioningJobStatusAction(orgId);
      if (cancelled || !result.ok) return;
      setStatus(result.status);
      setErrorMessage(result.errorMessage);
      if (result.status === "pending" || result.status === "running") {
        setTimeout(poll, 2000);
      }
    }
    void poll();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="text-3xl font-semibold">Provisioning your workspace</h1>
      <p className="text-muted-foreground">
        Organization {orgId || "(unknown)"} — async seed job status from{" "}
        <code>tenant_provisioning_jobs</code>.
      </p>
      <div className="rounded-xl border border-black/10 bg-white p-6 text-sm">
        <p className="font-medium">Status: {status}</p>
        {errorMessage && <p className="mt-2 text-red-600">{errorMessage}</p>}
        {(status === "completed" || status === "pending") && (
          <p className="mt-2 text-muted-foreground">
            Storefront: <code>{orgId ? `{slug}.store.rinads.com` : "—"}</code>
          </p>
        )}
      </div>
      <Link href="/" className="text-sm text-[#9f4bc7]">
        Return to home
      </Link>
    </div>
  );
}
