import Link from "next/link";
import { ArrowRight, Code2, Megaphone, Bot, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PILLARS: { icon: LucideIcon; title: string; subtitle: string; href: string }[] = [
  { icon: Code2, title: "Build", subtitle: "Custom Software", href: "/services#build" },
  { icon: Megaphone, title: "Grow", subtitle: "Growth Marketing", href: "/grow" },
  { icon: Bot, title: "Automate", subtitle: "AI & Workflow Automation", href: "/services#automate" },
  { icon: Layers, title: "Transform", subtitle: "Business Systems", href: "/services" },
];

export function ServicesOverview() {
  return (
    <section id="services" className="relative z-40 bg-rinads-primary-darkest px-6 py-24 text-white md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
          RINADS Services
        </p>
        <h2 className="text-4xl font-black leading-tight md:text-5xl">Build · Grow · Automate</h2>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Need someone to build and grow it? RINADS Services complements Business OS — we help you
          build systems, run campaigns, and automate operations.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, subtitle, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-rinads-primary/40"
            >
              <Icon className="h-8 w-8 text-rinads-primary" aria-hidden />
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-1 text-sm text-white/60">{subtitle}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rinads-primary opacity-0 transition group-hover:opacity-100">
                Learn more <ArrowRight size={12} aria-hidden />
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/services"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-rinads-primary"
        >
          View all services
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
