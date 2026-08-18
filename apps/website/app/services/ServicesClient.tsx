"use client";

import Link from "next/link";
import { ArrowRight, Code2, Megaphone, Bot, Layers } from "lucide-react";
import { ProductPageShell } from "@/components/product/ProductPageShell";

const PILLARS = [
  {
    id: "build",
    icon: Code2,
    title: "Build",
    subtitle: "Custom Software",
    description: "Web apps, mobile apps, ERP systems and business platforms.",
    href: "/projects",
  },
  {
    id: "grow",
    icon: Megaphone,
    title: "Grow",
    subtitle: "Growth Marketing",
    description: "SEO, social media, paid advertising and content systems.",
    href: "/grow",
  },
  {
    id: "automate",
    icon: Bot,
    title: "Automate",
    subtitle: "AI & Workflow Automation",
    description: "Chatbots, workflows, integrations and intelligent business processes.",
    href: "/projects",
  },
  {
    id: "transform",
    icon: Layers,
    title: "Transform",
    subtitle: "Business Systems",
    description: "Turn fragmented processes into connected operating systems.",
    href: "/business-os",
  },
];

export function ServicesClient() {
  return (
    <ProductPageShell>
      <section className="bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            RINADS Services
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Build. Grow. Automate.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            RINADS Services help you build and grow your business — while Business OS helps you run
            it.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl space-y-16">
          {PILLARS.map(({ id, icon: Icon, title, subtitle, description, href }) => (
            <article
              key={id}
              id={id}
              className="grid gap-8 border-b border-rinads-primary/10 pb-16 last:border-0 md:grid-cols-[auto_1fr_auto] md:items-center"
            >
              <Icon className="h-12 w-12 text-rinads-primary" aria-hidden />
              <div>
                <h2 className="text-2xl font-black text-foreground">{title}</h2>
                <p className="text-sm font-semibold uppercase tracking-wider text-rinads-primary">
                  {subtitle}
                </p>
                <p className="mt-3 text-muted-foreground">{description}</p>
              </div>
              <Link
                href={href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
              >
                Learn more
                <ArrowRight size={14} aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </ProductPageShell>
  );
}
