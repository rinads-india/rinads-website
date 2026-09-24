import type { Metadata } from "next";
import type { RoleKey } from "@rinads/permissions";
import { getPageMetadata } from "@/lib/cms";
import { requireOsShellAccess, readOsRequestPathname } from "@/lib/os-shell-access";
import { OsShellLayout } from "./OsClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/os");
}

/**
 * Shared Business OS shell. Every nested `/os/*` route runs the shared access resolver
 * (auth, membership, active org, salon→Rinaglow / onboarding destinations).
 */
export default async function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = await readOsRequestPathname();
  const access = await requireOsShellAccess(pathname);

  return (
    <OsShellLayout
      membershipRoleKey={access.roleKey as RoleKey | null}
      membershipResolved={access.enforced}
    >
      {children}
    </OsShellLayout>
  );
}
