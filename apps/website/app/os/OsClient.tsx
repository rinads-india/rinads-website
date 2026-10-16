"use client";

import { Suspense } from "react";
import type { RoleKey } from "@rinads/permissions";
import "@/app/os/os.css";
import { BusinessOsShell } from "@/components/os/BusinessOsShell";
import { OsOrgRoleProvider } from "@/components/os/OsOrgRoleProvider";

function OsShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#dfe8df] text-gray-800">
      Loading Business OS…
    </div>
  );
}

export function OsShellLayout({
  children,
  membershipRoleKey = null,
  membershipResolved = false,
  membershipPermissions = [],
}: {
  children: React.ReactNode;
  membershipRoleKey?: RoleKey | null;
  membershipResolved?: boolean;
  membershipPermissions?: readonly string[];
}) {
  return (
    <OsOrgRoleProvider
      membershipRoleKey={membershipRoleKey}
      membershipResolved={membershipResolved}
      membershipPermissions={membershipPermissions}
    >
      <Suspense fallback={<OsShellFallback />}>
        <BusinessOsShell>{children}</BusinessOsShell>
      </Suspense>
    </OsOrgRoleProvider>
  );
}
