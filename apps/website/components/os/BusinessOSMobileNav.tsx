"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getOsMobileMoreNavItems,
  getOsMobilePrimaryNavItems,
  resolveOsActiveNavId,
} from "@/lib/os-nav";
import { useOsOrgRole } from "@/components/os/OsOrgRoleProvider";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

export function BusinessOSMobileNav() {
  const pathname = usePathname() ?? "/os";
  const activeId = resolveOsActiveNavId(pathname);
  const { tier } = useOsOrgRole();
  const [moreOpen, setMoreOpen] = useState(false);
  const titleId = useId();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const primary = getOsMobilePrimaryNavItems(tier);
  const moreItems = getOsMobileMoreNavItems(tier);

  const navPath = pathname;
  const [lastPath, setLastPath] = useState(navPath);
  if (lastPath !== navPath) {
    setLastPath(navPath);
    if (moreOpen) setMoreOpen(false);
  }

  const closeMore = useCallback(() => {
    setMoreOpen(false);
  }, []);

  const openMore = useCallback(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? moreButtonRef.current;
    setMoreOpen(true);
  }, []);

  // Body scroll lock + initial focus + Escape/Tab trap + focus restore
  useEffect(() => {
    if (!moreOpen) return;

    const triggerButton = moreButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusFirst = () => {
      if (!dialog) return;
      const focusables = getFocusableElements(dialog);
      (focusables[0] ?? dialog).focus();
    };
    const frame = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMore();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const restore = previouslyFocusedRef.current ?? triggerButton;
      restore?.focus();
    };
  }, [moreOpen, closeMore]);

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
        className="os-glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex items-stretch gap-1 rounded-2xl p-1.5 shadow-lg lg:hidden"
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
                ref={moreButtonRef}
                type="button"
                className={className}
                aria-expanded={moreOpen}
                aria-haspopup="dialog"
                aria-controls={titleId}
                onClick={() => (moreOpen ? closeMore() : openMore())}
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
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close more menu"
            onClick={closeMore}
          />
          <div
            ref={dialogRef}
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-title`}
            tabIndex={-1}
            className="os-glass absolute inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] rounded-3xl p-4 shadow-2xl outline-none"
          >
            <p id={`${titleId}-title`} className="text-sm font-semibold text-gray-900">
              More
            </p>
            <ul className="mt-3 max-h-[min(60vh,24rem)] space-y-1 overflow-y-auto">
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
