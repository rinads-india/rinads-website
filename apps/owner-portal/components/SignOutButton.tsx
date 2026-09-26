"use client";

import { signOut } from "@rinads/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOwnerBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await signOut(createOwnerBrowserClient());
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={pending} className="text-sm text-muted-foreground hover:text-foreground">
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
