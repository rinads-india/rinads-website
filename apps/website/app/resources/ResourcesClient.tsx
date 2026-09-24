"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  CTASection,
} from "@/components/system";

const SECTIONS = [
  {
    title: "Guides",
    items: [
      { label: "CRM + projects + invoicing", href: "/platform/business-os", description: "Run customers, work, and money on one foundation." },
      { label: "Lead follow-up automation", href: "/platform/automation-os", description: "Governed workflows for follow-up with approvals." },
      { label: "WhatsApp business workflows", href: "/integrations/whatsapp", description: "Messaging integrations with explicit availability." },
      { label: "Replacing spreadsheets", href: "/docs", description: "Move operational work onto shared business context." },
    ],
  },
  {
    title: "Industry playbooks",
    items: [
      { label: "Retail operations", href: "/solutions/retail", description: "Catalogue, inventory, storefront, and orders." },
      { label: "Salon operations", href: "/solutions/salon", description: "Appointments, clients, loyalty, and campaigns." },
      { label: "Landscape / nursery", href: "/solutions/nursery", description: "Inventory, projects, and field operations." },
    ],
  },
  {
    title: "Platform & trust",
    items: [
      { label: "Platform architecture", href: "/platform", description: "How operating systems share one business foundation." },
      { label: "Security & governance", href: "/security", description: "Permissions, approvals, and auditability." },
      { label: "Customer stories", href: "/customers", description: "Approved case studies only — never invented metrics." },
      { label: "Changelog", href: "/changelog", description: "Product updates as they are published." },
    ],
  },
  {
    title: "Developer documentation",
    items: [
      { label: "Docs hub", href: "/docs", description: "Documentation foundation for the platform." },
      { label: "Developers", href: "/developers", description: "Auth, APIs, webhooks, and events — stable interfaces only." },
      { label: "Integrations", href: "/integrations", description: "Live, beta, private preview, or planned." },
    ],
  },
] as const;

export function ResourcesClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Resources"
        headline="Knowledge for running a connected business."
        summary="Guides, industry playbooks, architecture, security, and developer documentation — oriented around business problems, not generic AI news."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/docs"
        secondaryLabel="Open documentation"
      />
      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl space-y-14">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-rinads-primary">{section.title}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="border border-white/10 p-6 transition hover:border-rinads-primary/40"
                  >
                    <h3 className="text-lg font-bold text-foreground">{link.label}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <CTASection
        headline="Ready to see RINADS on your workflow?"
        summary="Book a platform demo or start a project conversation with the team."
      />
    </MarketingPageShell>
  );
}
