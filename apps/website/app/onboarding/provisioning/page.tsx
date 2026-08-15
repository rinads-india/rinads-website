import { Suspense } from "react";
import { ProvisioningStatusClient } from "./ProvisioningStatusClient";

export default function ProvisioningStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg space-y-6 py-12">
          <h1 className="text-3xl font-semibold">Provisioning your workspace</h1>
          <p className="text-muted-foreground">Loading provisioning status…</p>
        </div>
      }
    >
      <ProvisioningStatusClient />
    </Suspense>
  );
}
