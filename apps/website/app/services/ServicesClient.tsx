"use client";

import Link from "next/link";
import { ArrowRight, Code2, Megaphone, Bot, Layers } from "lucide-react";
import { ProductPageShell } from "@/components/product/ProductPageShell";
import type { ServiceCatalogItem } from "@/lib/services/types";
import { formatServicePrice } from "@/lib/services/types";

const PILLARS = [
  {
    id: "build",
    icon: Code2,
    title: "Build",
    subtitle: "Custom Software",
    description: "Web apps, mobile apps, ERP systems and business platforms.",
  },
  {
    id: "grow",
    icon: Megaphone,
    title: "Grow",
    subtitle: "Growth Marketing",
    description: "SEO, social media, paid advertising and content systems.",
  },
  {
    id: "automate",
    icon: Bot,
    title: "Automate",
    subtitle: "AI & Workflow Automation",
    description: "Chatbots, workflows, integrations and intelligent business processes.",
  },
  {
    id: "transform",
    icon: Layers,
    title: "Transform",
    subtitle: "Business Systems",
    description: "Turn fragmented processes into connected operating systems.",
  },
];

type Props = {
  catalog: ServiceCatalogItem[];
};

export function ServicesClient({ catalog }: Props) {
  return (
    <ProductPageShell>
      <section className="bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            RINADS Services
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Build. Grow. Automate. Transform.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            RINADS Services help you build and grow your business — while Business OS helps you run
            it.
          </p>
        </div>
      </section>

      {catalog.length > 0 ? (
        <section className="bg-rinads-primary-darkest px-6 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-2xl font-black text-white">Service catalog</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {catalog.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-rinads-primary/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-rinads-primary">
                    {item.pillar}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">{item.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{item.description}</p>
                  <p className="mt-4 text-sm font-semibold text-rinads-primary">
                    {formatServicePrice(item)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl space-y-16">
          {PILLARS.map(({ id, icon: Icon, title, subtitle, description }) => (
            <article
              key={id}
              id={id}
              className="grid gap-8 border-b border-rinads-primary/10 pb-16 last:border-0 md:grid-cols-[auto_1fr] md:items-center"
            >
              <Icon className="h-12 w-12 text-rinads-primary" aria-hidden />
              <div>
                <h2 className="text-2xl font-black text-foreground">{title}</h2>
                <p className="text-sm font-semibold uppercase tracking-wider text-rinads-primary">
                  {subtitle}
                </p>
                <p className="mt-3 text-muted-foreground">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ProductPageShell>
  );
}
