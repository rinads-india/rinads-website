"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleKey } from "@rinads/permissions";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/support", label: "Support" },
] as const;

type OwnerNavProps = {
  role?: RoleKey;
};

export function OwnerNav({ role = "founder" }: OwnerNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-rinads-primary/15 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rinads-primary">Ambady</p>
          <h1 className="text-lg font-semibold text-foreground">Owner Portal</h1>
        </div>
        <nav aria-label="Owner portal" className="flex flex-wrap gap-2">
          {links.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
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
      <p className="mx-auto max-w-6xl px-4 pb-3 text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{role}</span> — UI role labels are
        not authorization. Staff RBAC will be enforced server-side in Phase 1+.
      </p>
    </header>
  );
}
