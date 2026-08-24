import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrderStatus } from "@/lib/services/orders";
import { TrackOrderStatusClient } from "./TrackOrderStatusClient";

export const metadata: Metadata = {
  title: "Track order | RINADS Services",
};

type Props = { params: Promise<{ orderId: string }> };

export default async function TrackOrderPage({ params }: Props) {
  const { orderId } = await params;
  const order = await getPublicOrderStatus(orderId);
  if (!order) notFound();

  return (
    <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rinads-primary">
          RINADS Services
        </p>
        <h1 className="mt-2 text-3xl font-black">Order tracking</h1>
        <div className="mt-10 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs text-white/50">Order number</p>
            <p className="font-mono text-lg">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Service</p>
            <p className="text-lg">{order.serviceName}</p>
          </div>
          <TrackOrderStatusClient initialOrder={order} />
          {order.dueDate ? (
            <div>
              <p className="text-xs text-white/50">Expected delivery</p>
              <p>{new Date(order.dueDate).toLocaleDateString("en-IN")}</p>
            </div>
          ) : null}
        </div>
        <Link href="/services" className="mt-8 inline-block text-sm text-rinads-primary underline">
          Browse more services
        </Link>
      </div>
    </main>
  );
}
