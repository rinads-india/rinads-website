import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPlatformServiceBySlug } from "@/lib/services/catalog";
import { formatServicePrice } from "@/lib/services/types";
import { ServiceCheckoutButton } from "./ServiceCheckoutButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPlatformServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return { title: `${service.name} | RINADS Services` };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getPlatformServiceBySlug(slug);
  if (!service) notFound();

  return (
    <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/services"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-rinads-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          All services
        </Link>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">
          {service.pillar}
        </p>
        <h1 className="text-4xl font-black md:text-5xl">{service.name}</h1>
        <p className="mt-6 text-lg text-white/75">{service.description}</p>
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Starting from</p>
          <p className="mt-1 text-3xl font-bold text-rinads-primary">{formatServicePrice(service)}</p>
          {service.estimatedDeliveryDays ? (
            <p className="mt-2 text-sm text-white/50">
              Typical delivery: {service.estimatedDeliveryDays} days
            </p>
          ) : null}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <ServiceCheckoutButton serviceId={service.id} amount={service.basePrice ?? 0} />
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:border-rinads-primary"
          >
            Request quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
