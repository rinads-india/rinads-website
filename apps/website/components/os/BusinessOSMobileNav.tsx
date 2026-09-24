"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getOsMobileMoreNavItems,
  getOsMobilePrimaryNavItems,
  resolveOsActiveNavId,
} from "@/lib/os-nav";

export function BusinessOSMobileNav() {
  const pathname = usePathname() ?? "/os";
  const activeId = resolveOsActiveNavId(pathname);
  const [moreOpen, setMoreOpen] = useState(false);
  const titleId = useId();
  const primary = getOsMobilePrimaryNavItems();
  const moreItems = getOsMobileMoreNavItems();

  // Close More when the route changes without syncing open state in an effect.
  const navPath = pathname;
  const [lastPath, setLastPath] = useState(navPath);
  if (lastPath !== navPath) {
    setLastPath(navPath);
    if (moreOpen) setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const moreActive =
    activeId === "money" ||
    activeId === "automate" ||
    activeId === "rooms" ||
    activeId === "settings" ||
    activeId === "integrations";

  return (
    <>
      <nav
        aria-label="Business OS mobile"
        className="os-glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-stretch gap-1 rounded-2xl p-1.5 shadow-lg lg:hidden"
      >
        {primary.map((item) => {
          const Icon = item.icon;
          const isMore = item.id === "more";
          const active = isMore ? moreActive || moreOpen : item.id === activeId;
          const className = `flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
            active ? "bg-black text-white" : "text-gray-700 hover:bg-white/50"
          }`;

          if (isMore) {
            return (
              <button
                key={item.id}
                type="button"
                className={className}
                aria-expanded={moreOpen}
                aria-controls={titleId}
                onClick={() => setMoreOpen((value) => !value)}
              >
                <Icon size={16} aria-hidden />
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={className}
              aria-current={active ? "page" : undefined}
              onClick={closeMore}
            >
              <Icon size={16} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close more menu"
            onClick={closeMore}
          />
          <div
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-title`}
            className="os-glass absolute inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] rounded-3xl p-4 shadow-2xl"
          >
            <p id={`${titleId}-title`} className="text-sm font-semibold text-gray-900">
              More
            </p>
            <ul className="mt-3 space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeId;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={closeMore}
                      className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${
                        active ? "bg-black text-white" : "text-gray-800 hover:bg-white/60"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={16} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
