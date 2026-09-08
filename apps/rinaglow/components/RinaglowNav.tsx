"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pos", label: "POS" },
  { href: "/services", label: "Services" },
  { href: "/staff", label: "Staff" },
  { href: "/clients", label: "Clients" },
  { href: "/settings", label: "Settings" },
] as const;

export function RinaglowNav({ organizationName, roleKey }: { organizationName?: string; roleKey?: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-rinads-primary/15 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rinads-primary">R GLOW · Salon OS</p>
          <h1 className="text-lg font-semibold text-foreground">{organizationName ?? "Owner & staff console"}</h1>
        </div>
        <nav aria-label="Rinaglow console" className="flex flex-wrap gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                  active ? "bg-rinads-primary text-white" : "text-foreground hover:bg-surface-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      {roleKey ? (
        <p className="mx-auto max-w-6xl px-4 pb-3 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{roleKey}</span> — access is scoped by branch and
          organization permissions (RLS).
        </p>
      ) : null}
    </header>
  );
}
