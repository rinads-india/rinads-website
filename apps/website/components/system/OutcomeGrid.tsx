"use client";

import Link from "next/link";
import { trackMarketing } from "@/lib/analytics";

export type OutcomeCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  routeLabel: string;
  modules?: readonly string[];
};

/** Four primary business outcomes — BUILD is secondary, not an equal fifth card. */
const DEFAULT_OUTCOMES: OutcomeCard[] = [
  {
    id: "run",
    title: "RUN",
    description: "Customers, CRM, projects, finance and people.",
    href: "/platform/business",
    routeLabel: "Business",
    modules: ["Customers", "CRM", "Projects", "Finance", "People"],
  },
  {
    id: "sell",
    title: "SELL",
    description: "Products, commerce, orders and payments.",
    href: "/platform/commerce",
    routeLabel: "Commerce",
    modules: ["Products", "Commerce", "Orders", "Payments"],
  },
  {
    id: "grow",
    title: "GROW",
    description: "Leads, marketing, content and campaigns.",
    href: "/platform/growth",
    routeLabel: "Growth",
    modules: ["Leads", "Marketing", "Content", "Campaigns"],
  },
  {
    id: "automate",
    title: "AUTOMATE",
    description: "Workflows, agents, approvals and integrations.",
    href: "/platform/automation",
    routeLabel: "Automation",
    modules: ["Workflows", "Agents", "Approvals", "Integrations"],
  },
];

type OutcomeGridProps = {
  outcomes?: OutcomeCard[];
  className?: string;
  showBuildLink?: boolean;
};

export function OutcomeGrid({
  outcomes = DEFAULT_OUTCOMES,
  className = "",
  showBuildLink = true,
}: OutcomeGridProps) {
  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {outcomes.map((outcome) => (
          <Link
            key={outcome.id}
            href={outcome.href}
            onClick={() =>
              trackMarketing("platform_card_clicked", { outcome: outcome.id, href: outcome.href })
            }
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-rinads-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            <h3 className="text-lg font-bold tracking-[0.12em] text-foreground group-hover:text-rinads-primary">
              {outcome.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{outcome.description}</p>
            {outcome.modules?.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {outcome.modules.map((m) => (
                  <li
                    key={m}
                    className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              {outcome.routeLabel} →
            </p>
          </Link>
        ))}
      </div>
      {showBuildLink ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link
            href="/platform"
            className="font-semibold text-rinads-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            BUILD
          </Link>{" "}
          is an additional platform capability for turning requirements into maintainable systems.
        </p>
      ) : null}
    </div>
  );
}
