"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Package,
  User,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/addresses", label: "Addresses", icon: MapPin },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/support", label: "Support", icon: HelpCircle },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Customer portal"
      className="flex h-full flex-col border-r border-rinads-primary/15 bg-nav-surface backdrop-blur-md"
    >
      <div className="border-b border-rinads-primary/15 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rinads-primary">
          Ambady
        </p>
        <h1 className="text-lg font-bold text-foreground">Customer Portal</h1>
      </div>
      <ul className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary ${
                  active
                    ? "bg-rinads-primary/15 text-rinads-primary"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-rinads-primary/15 px-5 py-4 text-xs text-muted-foreground">
        Powered by RINADS Commerce
      </p>
    </nav>
  );
}
