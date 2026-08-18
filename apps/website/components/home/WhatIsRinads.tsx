import { Users, Briefcase, Wallet, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CARDS: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Users, title: "Customers", description: "Leads, clients, CRM and follow-ups" },
  { icon: Briefcase, title: "Work", description: "Projects, tasks, calendar and team operations" },
  { icon: Wallet, title: "Money", description: "Invoices, payments and financial visibility" },
  { icon: TrendingUp, title: "Growth", description: "Marketing, campaigns and analytics" },
  { icon: Zap, title: "Automation", description: "Workflows, integrations and intelligent actions" },
];

export function WhatIsRinads() {
  return (
    <section id="about" className="relative z-40 bg-surface px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary md:text-lg">
          What is RINADS?
        </p>
        <h2 className="max-w-3xl text-4xl font-black leading-tight text-foreground md:text-5xl">
          RINADS is a Business Operating System designed to connect the systems businesses use every
          day.
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {CARDS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-rinads-primary/15 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:bg-black/20"
            >
              <Icon className="mb-4 h-8 w-8 text-rinads-primary" aria-hidden />
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xl font-semibold text-foreground md:text-2xl">
          All connected. One workspace.
        </p>
      </div>
    </section>
  );
}
