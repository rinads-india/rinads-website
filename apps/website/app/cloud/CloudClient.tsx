"use client";

import Link from "next/link";
import { ArrowRight, Cloud, Database, Plug, Globe } from "lucide-react";
import { ProductPageShell } from "@/components/product/ProductPageShell";

const PILLARS = [
  { icon: Cloud, title: "Platform", description: "The foundation that powers Business OS and your workspace." },
  { icon: Database, title: "Data", description: "Connected business data across customers, work, finance, and growth." },
  { icon: Plug, title: "Integrations", description: "Webhooks, email, WhatsApp, and third-party tools in one ecosystem." },
  { icon: Globe, title: "Ecosystem", description: "Services, marketplace, and vertical solutions working together." },
];

export function CloudClient() {
  return (
    <ProductPageShell>
      <section className="bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            RINADS Cloud
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            The platform behind RINADS.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            RINADS Cloud connects your business applications, data, integrations and services into
            one ecosystem — without asking you to understand the infrastructure.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-rinads-primary/15 p-8">
                <Icon className="h-10 w-10 text-rinads-primary" aria-hidden />
                <h2 className="mt-4 text-xl font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap gap-4">
            <Link
              href="/business-os"
              className="inline-flex items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Explore Business OS
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-rinads-primary/30 px-6 py-3 text-sm font-semibold text-rinads-primary"
            >
              RINADS Services
            </Link>
          </div>
        </div>
      </section>
    </ProductPageShell>
  );
}
