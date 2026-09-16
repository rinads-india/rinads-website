"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  finalizeProvisioningDestinationAction,
  getProvisioningJobStatusAction,
} from "@/app/onboarding/actions/onboarding";

export function ProvisioningStatusClient() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") ?? "";
  const modules = searchParams.get("modules") ?? "";
  const defaultWelcomeHref = modules
    ? `/os?welcome=1&modules=${encodeURIComponent(modules.split(",")[0] ?? "customers")}`
    : "/os?welcome=1";
  const [status, setStatus] = useState("pending");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [destination, setDestination] = useState<string>();
  const finalizationStarted = useRef(false);
  const opensRinaglow = Boolean(destination && !destination.startsWith("/os"));

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

  useEffect(() => {
    if (!orgId || status !== "completed" || finalizationStarted.current) return;
    finalizationStarted.current = true;
    void finalizeProvisioningDestinationAction(orgId).then((result) => {
      if (result.ok) setDestination(result.destination);
      else setErrorMessage(result.error);
    });
  }, [orgId, status]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="text-3xl font-semibold">RINADS is preparing your workspace…</h1>
      <p className="text-muted-foreground">
        Configuring your modules and provisioning your tenant workspace.
      </p>
      <div className="rounded-xl border border-black/10 bg-white p-6 text-sm">
        <p className="font-medium">Status: {status}</p>
        {errorMessage && <p className="mt-2 text-red-600">{errorMessage}</p>}
        {(status === "completed" || status === "pending") && (
          <p className="mt-2 text-muted-foreground">
            Storefront: <code>{orgId ? `{slug}.store.rinads.com` : "—"}</code>
          </p>
        )}
        {status === "completed" && (
          <Link href={destination ?? defaultWelcomeHref} className="mt-4 inline-block text-sm font-semibold text-[#9f4bc7]">
            {opensRinaglow ? "Open R GLOW" : "Open Business OS"}
          </Link>
        )}
      </div>
      <Link href="/os" className="text-sm text-[#9f4bc7]">
        Return to Business OS
      </Link>
    </div>
  );
}
