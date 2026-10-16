"use client";

import Link from "next/link";
import { trackMarketing } from "@/lib/analytics";

export type OutcomeCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  routeLabel: string;
};

const DEFAULT_OUTCOMES: OutcomeCard[] = [
  {
    id: "run-business",
    title: "Run my business",
    description: "Customers, tasks, teams, money and daily operations.",
    href: "/platform/business-os",
    routeLabel: "Business OS",
  },
  {
    id: "sell-more",
    title: "Sell more",
    description: "Products, orders, customers, payments and fulfilment.",
    href: "/platform/commerce-os",
    routeLabel: "Commerce OS",
  },
  {
    id: "grow-customers",
    title: "Grow customers",
    description: "Campaigns, leads, follow-ups and CRM.",
    href: "/platform/marketing-os",
    routeLabel: "Marketing / Growth",
  },
  {
    id: "automate-work",
    title: "Automate work",
    description: "Reduce repetitive tasks with controlled workflows.",
    href: "/platform/automation-os",
    routeLabel: "Automation",
  },
  {
    id: "build-software",
    title: "Build software",
    description: "Turn operational requirements into maintainable systems.",
    href: "/services/software",
    routeLabel: "Build / Services",
  },
  {
    id: "train-team",
    title: "Train my team",
    description: "Practical capability connected to real work.",
    href: "/academy",
    routeLabel: "Academy",
  },
];

type OutcomeGridProps = {
  outcomes?: OutcomeCard[];
  className?: string;
};

export function OutcomeGrid({ outcomes = DEFAULT_OUTCOMES, className = "" }: OutcomeGridProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {outcomes.map((outcome) => (
        <Link
          key={outcome.id}
          href={outcome.href}
          onClick={() => trackMarketing("platform_card_clicked", { outcome: outcome.id, href: outcome.href })}
          className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
        >
          <h3 className="text-lg font-bold text-foreground group-hover:text-rinads-primary">{outcome.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{outcome.description}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
            {outcome.routeLabel} →
          </p>
        </Link>
      ))}
    </div>
  );
}
