"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  finalizeProvisioningDestinationAction,
  getProvisioningJobStatusAction,
} from "@/app/onboarding/actions/onboarding";

const OWNER_PORTAL_URL = (
  process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? "https://app.rinads.com"
).replace(/\/$/, "");

const POLLING_STATUSES = new Set([
  "awaiting_payment",
  "activation_pending",
  "pending",
  "running",
]);

function statusCopy(status: string): { title: string; detail: string } {
  switch (status) {
    case "awaiting_payment":
      return {
        title: "Awaiting verified payment",
        detail:
          "Your business identity is ready. Paid capabilities and tenant data remain locked until Razorpay confirms an active subscription through the signed webhook.",
      };
    case "activation_pending":
      return {
        title: "Payment verified — preparing activation",
        detail:
          "Your paid entitlement is active. RINADS is waiting for the idempotent provisioning handoff before any tenant data is seeded.",
      };
    case "pending":
      return {
        title: "Provisioning queued",
        detail:
          "Payment is verified and your tenant is queued for governed setup.",
      };
    case "running":
      return {
        title: "Provisioning workspace",
        detail:
          "RINADS is configuring the selected operating pack and tenant-scoped data.",
      };
    case "completed":
      return {
        title: "Workspace ready",
        detail:
          "Provisioning completed. Your organization can now open its assigned RINADS operating surface.",
      };
    case "failed":
      return {
        title: "Provisioning needs attention",
        detail:
          "Your entitlement remains recorded, but workspace setup did not complete. No duplicate tenant will be created automatically.",
      };
    default:
      return {
        title: "Checking activation",
        detail: "RINADS is verifying billing and provisioning state.",
      };
  }
}

export function ProvisioningStatusClient() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") ?? "";
  const modules = searchParams.get("modules") ?? "";
  const defaultWelcomeHref = modules
    ? `/os?welcome=1&modules=${encodeURIComponent(modules.split(",")[0] ?? "customers")}`
    : "/os?welcome=1";
  const [status, setStatus] = useState("checking");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [destination, setDestination] = useState<string>();
  const finalizationStarted = useRef(false);
  const opensRinaglow = Boolean(destination && !destination.startsWith("/os"));
  const copy = statusCopy(status);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled) return;
      const result = await getProvisioningJobStatusAction(orgId);
      if (cancelled) return;
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setStatus(result.status);
      setErrorMessage(result.errorMessage);
      if (POLLING_STATUSES.has(result.status)) {
        const delay = result.status === "awaiting_payment" ? 5000 : 2000;
        timer = setTimeout(poll, delay);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4bc7]">
          RINADS activation
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted-foreground">{copy.detail}</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">Activation status</p>
          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold">
            {status.replaceAll("_", " ")}
          </span>
        </div>

        {errorMessage && <p className="mt-3 text-red-600">{errorMessage}</p>}

        {status === "awaiting_payment" && (
          <div className="mt-5 rounded-xl border border-[#9f4bc7]/20 bg-[#9f4bc7]/5 p-4">
            <p className="font-medium">Next: authorize your RINADS plan</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Checkout does not unlock the workspace by itself. Activation happens only after the signed provider webhook confirms the subscription as active.
            </p>
            <a
              href={`${OWNER_PORTAL_URL}/settings/billing`}
              className="mt-4 inline-flex rounded-full bg-[#9f4bc7] px-4 py-2 text-sm font-semibold text-white"
            >
              Continue to secure billing
            </a>
          </div>
        )}

        {status === "activation_pending" && (
          <p className="mt-4 text-muted-foreground">
            Payment entitlement is active. The provisioning handoff is being reconciled; this page will advance automatically when the job is queued.
          </p>
        )}

        {status === "completed" && (
          <>
            <p className="mt-4 text-muted-foreground">
              Tenant setup is complete and the destination is being resolved from your organization role and industry configuration.
            </p>
            <Link
              href={destination ?? defaultWelcomeHref}
              className="mt-4 inline-block text-sm font-semibold text-[#9f4bc7]"
            >
              {opensRinaglow ? "Open R GLOW" : "Open Business OS"}
            </Link>
          </>
        )}

        {status === "failed" && (
          <p className="mt-4 text-muted-foreground">
            The failed job remains auditable for controlled retry. Contact RINADS support rather than creating another organization.
          </p>
        )}
      </div>

      <Link href="/os" className="text-sm text-[#9f4bc7]">
        Return to Business OS
      </Link>
    </div>
  );
}
