import type { Metadata } from "next";
import Link from "next/link";
import { getPublicOrderStatus } from "@/lib/services/orders";

export const metadata: Metadata = {
  title: "Service checkout | RINADS Services",
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function ServiceCheckoutPage({ searchParams }: Props) {
  const { orderId } = await searchParams;
  if (!orderId) {
    return (
      <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 py-32 text-white">
        <p>Missing order. <Link href="/services" className="text-rinads-primary underline">Browse services</Link></p>
      </main>
    );
  }

  const status = await getPublicOrderStatus(orderId);

  return (
    <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black">Checkout</h1>
        {status ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50">Order</p>
            <p className="font-mono text-lg">{status.orderNumber}</p>
            <p className="text-white/75">{status.serviceName}</p>
            <p className="text-sm capitalize text-rinads-primary">Status: {status.status.replace(/_/g, " ")}</p>
            <p className="text-sm text-white/60">
              Complete payment via Razorpay (configure RAZORPAY_KEY_ID in Vercel). Pass{" "}
              <code className="rounded bg-black/40 px-1">service_order_id</code> in payment notes.
            </p>
            <Link
              href={`/track/${orderId}`}
              className="inline-block text-sm font-semibold text-rinads-primary underline"
            >
              Track this order
            </Link>
          </div>
        ) : (
          <p className="mt-6 text-white/70">Order not found or not yet visible.</p>
        )}
      </div>
    </main>
  );
}
