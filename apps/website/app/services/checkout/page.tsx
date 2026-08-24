import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPublicOrderStatus,
  getServiceOrderForCheckout,
} from "@/lib/services/orders";
import { formatServicePrice } from "@/lib/services/types";
import { resolveWebsiteTenancy } from "@/lib/tenancy";
import { ServiceRazorpayCheckout } from "./ServiceRazorpayCheckout";

export const metadata: Metadata = {
  title: "Service checkout | RINADS Services",
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ orderId?: string }>;
};

const PAID_STATUSES = new Set(["paid", "assigned", "in_progress", "review", "delivered"]);

export default async function ServiceCheckoutPage({ searchParams }: Props) {
  const { orderId } = await searchParams;
  if (!orderId) {
    return (
      <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 py-32 text-white">
        <p>
          Missing order.{" "}
          <Link href="/services" className="text-rinads-primary underline">
            Browse services
          </Link>
        </p>
      </main>
    );
  }

  const publicStatus = await getPublicOrderStatus(orderId);
  if (!publicStatus) {
    return (
      <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-black">Checkout</h1>
          <p className="mt-6 text-white/70">Order not found or not yet visible.</p>
        </div>
      </main>
    );
  }

  if (PAID_STATUSES.has(publicStatus.status)) {
    redirect(`/track/${encodeURIComponent(orderId)}`);
  }

  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) {
    redirect(`/signup?next=${encodeURIComponent(`/services/checkout?orderId=${orderId}`)}`);
  }

  const order = await getServiceOrderForCheckout(orderId, tenancy.organizationId);
  if (!order) {
    return (
      <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-black">Checkout</h1>
          <p className="mt-6 text-white/70">You do not have access to this order.</p>
        </div>
      </main>
    );
  }

  const amountLabel = formatServicePrice({
    basePrice: order.amount,
    currency: order.currency,
    pricingModel: "fixed",
  });

  return (
    <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black">Checkout</h1>
        <p className="mt-2 text-sm text-white/60">Secure payment powered by Razorpay</p>
        <ServiceRazorpayCheckout
          orderId={orderId}
          orderNumber={publicStatus.orderNumber}
          serviceName={publicStatus.serviceName}
          amountLabel={amountLabel}
        />
      </div>
    </main>
  );
}
