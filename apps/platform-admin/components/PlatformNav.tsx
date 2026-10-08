import Link from "next/link";

const standardLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/tenants", label: "Tenants" },
  { href: "/tenants/new", label: "Provision" },
  { href: "/templates", label: "Templates" },
  { href: "/plans", label: "Plans" },
  { href: "/billing/events", label: "Billing events" },
  { href: "/website/pages", label: "Website CMS" },
  { href: "/website/seo", label: "SEO" },
  { href: "/website/media", label: "Media" },
  { href: "/website/redirects", label: "Redirects" },
];

const founderLinks = [
  { href: "/founder-intelligence", label: "Founder Intelligence" },
  { href: "/rinpo", label: "RINPO Control" },
];

export function PlatformNav({ showFounderControls = false }: { showFounderControls?: boolean }) {
  const links = showFounderControls ? [...founderLinks, ...standardLinks] : standardLinks;

  return (
    <header className="border-b border-[color-mix(in_srgb,var(--rinads-primary)_15%,transparent)] bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">RINADS Platform</p>
          <h1 className="text-lg font-semibold text-foreground">Control Plane</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-rinads-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
