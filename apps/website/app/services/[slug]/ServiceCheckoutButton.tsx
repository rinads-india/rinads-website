"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createServiceOrderAction } from "../actions";

type Props = {
  serviceId: string;
};

export function ServiceCheckoutButton({ serviceId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createServiceOrderAction(serviceId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/services/checkout?orderId=${encodeURIComponent(result.orderId)}`);
          });
        }}
        className="inline-flex items-center rounded-full bg-rinads-primary px-8 py-3 text-sm font-bold text-white hover:bg-rinads-primary/90 disabled:opacity-60"
      >
        {pending ? "Creating order…" : "Continue to checkout"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
