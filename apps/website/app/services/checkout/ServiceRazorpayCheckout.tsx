"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRazorpayCheckoutSessionAction } from "../actions";

type Props = {
  orderId: string;
  orderNumber: string;
  serviceName: string;
  amountLabel: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function ServiceRazorpayCheckout({
  orderId,
  orderNumber,
  serviceName,
  amountLabel,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const session = await createRazorpayCheckoutSessionAction(orderId);
      if (!session.ok) {
        setError(session.error);
        return;
      }

      await loadRazorpayScript();
      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        setError("Payment provider failed to load.");
        return;
      }

      const checkout = new Razorpay({
        key: session.keyId,
        order_id: session.razorpayOrderId,
        amount: session.amountPaise,
        currency: "INR",
        name: "RINADS Services",
        description: serviceName,
        prefill: session.prefill,
        notes: {
          service_order_id: session.orderId,
        },
        theme: { color: "#9f4bc7" },
        handler: () => {
          router.push(`/track/${encodeURIComponent(orderId)}`);
          router.refresh();
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      checkout.on("payment.failed", (response: unknown) => {
        const payload = response as { error?: { description?: string } };
        setError(payload.error?.description ?? "Payment failed. Please try again.");
        setLoading(false);
      });

      checkout.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router, serviceName]);

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/50">Order</p>
        <p className="font-mono text-lg">{orderNumber}</p>
        <p className="mt-2 text-white/75">{serviceName}</p>
        <p className="mt-4 text-2xl font-bold text-rinads-primary">{amountLabel}</p>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void startCheckout()}
          className="inline-flex items-center rounded-full bg-rinads-primary px-6 py-3 text-sm font-bold text-white hover:bg-rinads-primary/90 disabled:opacity-60"
        >
          {loading ? "Opening payment…" : "Pay with Razorpay"}
        </button>
        <Link
          href={`/track/${encodeURIComponent(orderId)}`}
          className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:border-rinads-primary"
        >
          View order status
        </Link>
      </div>
    </div>
  );
}
