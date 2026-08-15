"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleKey } from "@rinads/permissions";

const links = [
  { href: "/operations", label: "Control Tower" },
  { href: "/runtime", label: "Runtime" },
  { href: "/approvals", label: "Approvals" },
  { href: "/inventory", label: "Inventory" },
  { href: "/procurement/purchase-orders", label: "Procurement" },
  { href: "/fulfilment", label: "Fulfilment" },
  { href: "/returns", label: "Returns" },
  { href: "/orders", label: "Orders" },
  { href: "/products", label: "Products" },
  { href: "/tasks", label: "Tasks" },
  { href: "/search", label: "Search" },
  { href: "/support", label: "Support" },
] as const;

type OwnerNavProps = {
  role?: RoleKey;
};

export function OwnerNav({ role = "founder" }: OwnerNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-rinads-primary/15 bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rinads-primary">Ambady ERP</p>
          <h1 className="text-lg font-semibold text-foreground">Operations Control Tower</h1>
        </div>
        <nav aria-label="Owner portal" className="flex flex-wrap gap-1">
          {links.map(({ href, label }) => {
            const active =
              href === "/operations"
                ? pathname === "/" || pathname === "/operations"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href === "/operations" ? "/operations" : href}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                  active
                    ? "bg-rinads-primary text-white"
                    : "text-foreground hover:bg-surface-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <p className="mx-auto max-w-7xl px-4 pb-3 text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{role}</span> — RBAC enforced via domain services + RLS in production.
      </p>
    </header>
  );
}
