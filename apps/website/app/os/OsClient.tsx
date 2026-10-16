"use client";

import { Suspense } from "react";
import type { RoleKey } from "@rinads/permissions";
import "@/app/os/os.css";
import { BusinessOsShell } from "@/components/os/BusinessOsShell";
import { OsOrgRoleProvider } from "@/components/os/OsOrgRoleProvider";
import { CompanyOsModeProvider } from "@/components/os/CompanyOsModeContext";

function OsShellFallback({ companyOsMode }: { companyOsMode: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#dfe8df] text-gray-800">
      {companyOsMode ? "Loading Company OS…" : "Loading Business OS…"}
    </div>
  );
}

export function OsShellLayout({
  children,
  membershipRoleKey = null,
  membershipResolved = false,
  companyOsMode = false,
}: {
  children: React.ReactNode;
  membershipRoleKey?: RoleKey | null;
  membershipResolved?: boolean;
  companyOsMode?: boolean;
}) {
  return (
    <CompanyOsModeProvider companyOsMode={companyOsMode}>
      <OsOrgRoleProvider
        membershipRoleKey={membershipRoleKey}
        membershipResolved={membershipResolved}
      >
        <Suspense fallback={<OsShellFallback companyOsMode={companyOsMode} />}>
          <BusinessOsShell>{children}</BusinessOsShell>
        </Suspense>
      </OsOrgRoleProvider>
    </CompanyOsModeProvider>
  );
}
