"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getOsDesktopNavItems,
  getOsSidebarUtilityItems,
  resolveOsActiveNavId,
  type OsNavItem,
} from "@/lib/os-nav";
import { useOsOrgRole } from "@/components/os/OsOrgRoleProvider";

function NavLink({ item, active }: { item: OsNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-black text-white shadow-md" : "text-gray-800 hover:bg-white/50"
      }`}
    >
      <Icon size={16} aria-hidden />
      {item.label}
    </Link>
  );
}

export function OsNavPanel() {
  const pathname = usePathname() ?? "/os";
  const activeId = resolveOsActiveNavId(pathname);
  const { tier } = useOsOrgRole();
  const primary = getOsDesktopNavItems(tier);
  const utility = getOsSidebarUtilityItems(tier);

  const primaryItems = primary.filter((item) => item.id !== "rooms");
  const roomsItem = primary.find((item) => item.id === "rooms");

  return (
    <nav
      aria-label="Business OS primary"
      data-os-guide="dashboard"
      className="os-glass hidden flex-col gap-4 rounded-3xl p-4 shadow-sm lg:flex lg:min-h-[420px] lg:w-56"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rinads-primary">
          BUSINESS OS
        </p>
        <h2 className="mt-1 text-sm font-semibold leading-snug text-gray-900">RINADS Business OS</h2>
      </div>

      <ul className="flex flex-col gap-1">
        {primaryItems.map((item) => (
          <li key={item.id}>
            <NavLink item={item} active={item.id === activeId} />
          </li>
        ))}
      </ul>

      {roomsItem && (
        <div className="border-t border-white/40 pt-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Collaboration
          </p>
          <NavLink item={roomsItem} active={roomsItem.id === activeId} />
        </div>
      )}

      {utility.length > 0 && (
        <div className="mt-auto border-t border-white/40 pt-3">
          <ul className="flex flex-col gap-1">
            {utility.map((item) => (
              <li key={item.id}>
                <NavLink item={item} active={item.id === activeId} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
