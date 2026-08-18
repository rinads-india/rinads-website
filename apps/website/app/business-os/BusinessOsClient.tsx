"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductPageShell } from "@/components/product/ProductPageShell";
import { useAuth } from "@/contexts/AuthContext";

const MODULE_GROUPS = [
  { label: "Customer", items: ["Leads", "Clients", "CRM", "Follow-ups"] },
  { label: "Work", items: ["Projects", "Tasks", "Calendar", "Team"] },
  { label: "Finance", items: ["Invoices", "Payments", "Expenses", "Reports"] },
  { label: "Growth", items: ["Marketing", "Campaigns", "Analytics", "SEO"] },
  { label: "Automation", items: ["Workflows", "Integrations", "Notifications", "Scheduled actions"] },
  { label: "Intelligence", items: ["RINPO", "Insights", "Recommendations", "Business questions"] },
];

export function BusinessOsClient() {
  const { isAuthenticated } = useAuth();

  return (
    <ProductPageShell>
      <section className="bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            Business OS
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Your business, connected.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            One operating system for customers, work, money, growth and automation.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Get Started
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href={isAuthenticated ? "/os" : "/signup?mode=login"}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold"
            >
              {isAuthenticated ? "Open Business OS" : "Log in to Business OS"}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black text-foreground md:text-4xl">Modules inside Business OS</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Functional modules — not separate &quot;OS&quot; products. One platform, connected data.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULE_GROUPS.map((group) => (
              <div key={group.label} className="rounded-2xl border border-rinads-primary/15 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rinads-primary">
                  {group.label}
                </h3>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ProductPageShell>
  );
}
