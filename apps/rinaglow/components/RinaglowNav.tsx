"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { signOut } from "@rinads/auth";
import { createRinaglowBrowserClient } from "@/lib/supabase/browser";
import { BranchSwitcher, branchHref, type BranchOption } from "./BranchSwitcher";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pos", label: "POS" },
  { href: "/inventory", label: "Inventory" },
  { href: "/services", label: "Services" },
  { href: "/staff", label: "Staff" },
  { href: "/clients", label: "Clients" },
  { href: "/growth", label: "Growth" },
  { href: "/loyalty", label: "Loyalty" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/communications", label: "Comms" },
  { href: "/settings", label: "Settings" },
] as const;

const mobilePrimary = ["/dashboard", "/calendar", "/pos", "/clients"] as const;
const mobileSecondary = links.filter((link) => !mobilePrimary.includes(link.href as (typeof mobilePrimary)[number]));

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGlyph({ href }: { href: string }) {
  const common = "h-5 w-5";
  if (href === "/dashboard") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    );
  }
  if (href === "/calendar") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    );
  }
  if (href === "/pos") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 9h10M7 13h4M15 13h2M7 17h10" />
      </svg>
    );
  }
  if (href === "/clients") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M17 11a4 4 0 0 1 4 4v6M16.5 3.2a4 4 0 0 1 0 7.6" />
      </svg>
    );
  }
  return null;
}

function HeaderTools({
  branches,
  signingOut,
  onSignOut,
  organizationName,
  roleKey,
}: {
  branches: BranchOption[];
  signingOut: boolean;
  onSignOut: () => void;
  organizationName?: string;
  roleKey?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const branchId = searchParams.get("branch");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const moreActive = useMemo(() => mobileSecondary.some((link) => isActivePath(pathname, link.href)), [pathname]);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMoreOpen]);

  return (
    <>
      <div className="w-full lg:w-auto">
        <BranchSwitcher branches={branches} />
      </div>

      <nav aria-label="R GLOW console" className="hidden max-w-[62vw] items-center gap-1 overflow-x-auto lg:flex">
        {links.map(({ href, label }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={branchHref(href, branchId)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-[background,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary/50 ${
                active
                  ? "bg-rinads-primary text-white shadow-sm"
                  : "text-foreground/75 hover:bg-surface-muted hover:text-foreground active:scale-[0.98]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary/50 disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </nav>

      <nav
        aria-label="R GLOW mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-rinads-primary/15 bg-surface/95 px-2 pt-1.5 shadow-[0_-12px_30px_rgba(42,15,66,0.08)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobilePrimary.map((href) => {
            const link = links.find((item) => item.href === href)!;
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={branchHref(href, branchId)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
                  active ? "bg-rinads-primary/10 text-rinads-primary" : "text-muted-foreground active:bg-surface-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <NavGlyph href={href} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen(true)}
            aria-expanded={mobileMoreOpen}
            aria-controls="rglow-mobile-more"
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
              moreActive || mobileMoreOpen ? "bg-rinads-primary/10 text-rinads-primary" : "text-muted-foreground active:bg-surface-muted"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
            <span>More</span>
          </button>
        </div>
      </nav>

      {mobileMoreOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="More R GLOW tools">
          <button
            type="button"
            className="absolute inset-0 bg-[#0a0612]/40 backdrop-blur-[2px]"
            aria-label="Close more menu"
            onClick={() => setMobileMoreOpen(false)}
          />
          <section
            id="rglow-mobile-more"
            className="rg-sheet absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[1.75rem] border border-rinads-primary/15 bg-surface px-4 pb-6 pt-3 shadow-2xl"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rinads-primary/20" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">R GLOW workspace</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{organizationName ?? "Owner & staff console"}</h2>
                {roleKey ? <p className="mt-1 text-xs text-muted-foreground">Signed in as {roleKey}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-muted text-xl text-foreground"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {mobileSecondary.map(({ href, label }) => {
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={branchHref(href, branchId)}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition active:scale-[0.99] ${
                      active
                        ? "border-rinads-primary/30 bg-rinads-primary/10 text-rinads-primary"
                        : "border-rinads-primary/10 bg-surface text-foreground hover:bg-surface-muted"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{label}</span>
                    <span aria-hidden className="text-muted-foreground">›</span>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl border border-rinads-primary/15 bg-surface-muted px-4 text-sm font-semibold text-foreground disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}

export function RinaglowNav({
  organizationName,
  roleKey,
  branches = [],
}: {
  organizationName?: string;
  roleKey?: string;
  branches?: BranchOption[];
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(createRinaglowBrowserClient());
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-rinads-primary/15 bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/assets/rglow-logo.png"
              alt="R GLOW"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-xl object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rinads-primary sm:text-xs">R GLOW · Salon OS</p>
              <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{organizationName ?? "Owner & staff console"}</h1>
            </div>
          </div>
          {roleKey ? (
            <span className="hidden shrink-0 rounded-full border border-rinads-primary/15 bg-rinads-primary/5 px-3 py-1.5 text-xs font-medium text-muted-foreground xl:inline-flex">
              {roleKey}
            </span>
          ) : null}
        </div>

        <Suspense fallback={null}>
          <div className="mt-3 flex flex-col gap-3 lg:mt-2 lg:flex-row lg:items-center lg:justify-between">
            <HeaderTools
              branches={branches}
              signingOut={signingOut}
              onSignOut={handleSignOut}
              organizationName={organizationName}
              roleKey={roleKey}
            />
          </div>
        </Suspense>
      </div>
    </header>
  );
}
