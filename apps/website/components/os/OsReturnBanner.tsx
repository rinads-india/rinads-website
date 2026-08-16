"use client";

import Link from "next/link";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { useAuth } from "@/contexts/AuthContext";
import { OS_PATH } from "@/lib/post-auth-destination";

export function OsReturnBanner() {
  const { isAuthenticated } = useAuth();
  const { navMenuOpen } = useRinpo();

  if (!isAuthenticated || navMenuOpen) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2 rounded-full border border-rinads-primary/30 bg-[var(--nav-surface)] px-4 py-2 text-center text-sm shadow-lg backdrop-blur-md">
      <Link href={OS_PATH} className="font-semibold text-rinads-primary hover:underline">
        Return to Business OS
      </Link>
    </div>
  );
}
