"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/rinads/Logo";
import { ThemeToggle } from "@/components/rinads/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayName } from "@/lib/user-display-name";

export function OsTopBar() {
  const { user, logout } = useAuth();
  const displayName = getUserDisplayName({
    displayName: user?.displayName,
    email: user?.email ?? user?.username,
  });

  return (
    <header className="os-glass flex items-center gap-3 rounded-2xl px-3 py-2 shadow-sm sm:px-4">
      <Link href="/os" className="flex shrink-0 items-center" aria-label="RINADS Business OS Home">
        <Logo className="h-7 w-auto" />
      </Link>

      <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
        <p className="truncate text-xs font-medium text-gray-700">RINADS Business OS</p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle className="hidden h-10 w-10 sm:inline-flex" />
        <button
          type="button"
          aria-label="Search"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/50 text-gray-800 transition hover:bg-white/70"
        >
          <Search size={16} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/50 text-gray-800 transition hover:bg-white/70"
        >
          <Bell size={16} aria-hidden />
        </button>
        <div className="relative">
          <details className="group">
            <summary
              className="flex h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl bg-white/50 px-2 text-xs font-semibold text-gray-800 transition hover:bg-white/70 [&::-webkit-details-marker]:hidden"
              aria-label={`Profile menu for ${displayName}`}
            >
              <span className="max-w-[4.5rem] truncate capitalize sm:max-w-[7rem]">
                {displayName === "there" ? "Profile" : displayName}
              </span>
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-white/40 bg-white/95 p-2 shadow-lg backdrop-blur">
              <p className="px-2 py-1 text-xs text-gray-500">Signed in</p>
              <button
                type="button"
                onClick={() => void logout()}
                className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
