import { isPrivilegedRoleKey } from "@rinads/permissions";
import { RinaglowNav } from "@/components/RinaglowNav";
import { RinpoCommandBar } from "@/components/RinpoCommandBar";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { Suspense } from "react";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const tenancy = await requireTenancy();
  const membership = tenancy.memberships.find((m) => m.organizationId === tenancy.organizationId);
  const canApprove = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("org.manage");
  const repo = await getSalonRepository();
  const branchesResult = await repo.listBranches(tenancy.organizationId);
  const branches = (branchesResult.ok ? branchesResult.data : [])
    .filter((branch) => branch.isActive)
    .map((branch) => ({ id: branch.id, name: branch.name }));

  return (
    <>
      <RinaglowNav organizationName={membership?.organizationName} roleKey={tenancy.roleKey} branches={branches} />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-32">{children}</main>
      <Suspense fallback={null}>
        <RinpoCommandBar canApprove={canApprove} />
      </Suspense>
    </>
  );
}
