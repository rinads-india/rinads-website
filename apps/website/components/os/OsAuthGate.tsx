"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function OsAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isDemoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isDemoMode && !isAuthenticated) {
      router.replace("/signup?mode=login&next=/os");
    }
  }, [isAuthenticated, isDemoMode, router]);

  if (isDemoMode && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Redirecting to sign in…
      </div>
    );
  }

  return children;
}
